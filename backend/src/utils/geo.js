// utils/geo.js
// Small, dependency-free geo helpers. We do distance maths in plain JS rather
// than reaching for PostGIS, because for a 1 km radius lookup the upstream API
// already returns a local set of incidents — we only need to filter/measure.
// (In a production build at scale you'd push this into PostGIS; that's a good
// thing to say in an interview, and the code is structured so you could.)

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** True if (lat,lng) is within radiusKm of the centre point. */
export function isWithin(centerLat, centerLng, lat, lng, radiusKm) {
  return haversineKm(centerLat, centerLng, lat, lng) <= radiusKm;
}

// --- Minimal TTL cache -------------------------------------------------------
// Avoids hammering the upstream crime API when the user pans the map a little.
export class TtlCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}
