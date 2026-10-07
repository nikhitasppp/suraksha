// routes/helplines.js
import express from 'express';
import { haversineKm } from '../utils/geo.js';

const router = express.Router();

const HELPLINES = [
  { name: 'Emergency (All Services)', number: '112', note: 'Police, fire, ambulance — single emergency number' },
  { name: 'Women Helpline', number: '1091', note: 'National women in distress helpline' },
  { name: 'Women Helpline (Domestic Abuse)', number: '181', note: 'Women in distress / domestic abuse' },
  { name: 'Police', number: '100', note: 'Traditional police control room' },
  { name: 'Ambulance', number: '102', note: 'Medical emergency' },
];

// Tried in order; first success wins.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

async function queryOverpass(query) {
  let lastErr;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const resp = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn(`[overpass] mirror ${mirror} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw new Error(`All Overpass mirrors failed. Last error: ${lastErr?.message}`);
}

router.get('/helplines', (_req, res) => res.json(HELPLINES));

router.get('/police-stations', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  console.log(`[police-stations] querying for lat=${lat}, lng=${lng}`);

  const radiusM = 10000; // 10 km
  const query = `[out:json][timeout:25];
    (
      node["amenity"="police"](around:${radiusM},${lat},${lng});
      way["amenity"="police"](around:${radiusM},${lat},${lng});
      relation["amenity"="police"](around:${radiusM},${lat},${lng});
    );
    out center 20;`;

  try {
    const body = await queryOverpass(query);

    const stations = (body.elements || [])
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat == null || elLng == null) return null;
        return {
          name: el.tags?.name || 'Police Station',
          phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
          lat: elLat,
          lng: elLng,
          distanceKm: +haversineKm(lat, lng, elLat, elLng).toFixed(2),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    res.json(stations);
  } catch (err) {
    console.error('police-stations lookup failed:', err.message);
    res.status(502).json({ error: 'Could not fetch nearby police stations', detail: err.message });
  }
});

export default router;
