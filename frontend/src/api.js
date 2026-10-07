// src/api.js
// All network calls in one module so the components stay clean and the backend
// URL is configurable in one spot.

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function json(res) {
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json()).error || '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Core safety lookup. `hour` lets the score reflect time of day.
  getSafety(lat, lng, hour) {
    const h = hour == null ? '' : `&hour=${hour}`;
    return fetch(`${API}/safety?lat=${lat}&lng=${lng}${h}`).then(json);
  },

  getReports(lat, lng, radiusKm = 2) {
    return fetch(`${API}/reports?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`).then(json);
  },
  getReportTypes() {
    return fetch(`${API}/reports/types`).then(json);
  },
  postReport(payload) {
    return fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json);
  },

  createCheckin(payload) {
    return fetch(`${API}/checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json);
  },
  getCheckin(id) {
    return fetch(`${API}/checkins/${id}`).then(json);
  },
  markSafe(id) {
    return fetch(`${API}/checkins/${id}/safe`, { method: 'POST' }).then(json);
  },

  getHelplines() {
    return fetch(`${API}/helplines`).then(json);
  },
  getPoliceStations(lat, lng) {
    return fetch(`${API}/police-stations?lat=${lat}&lng=${lng}`).then(json);
  },

  // Free OpenStreetMap geocoding so users can search an area by name.
  // (Nominatim usage policy: low volume, identify the app. Fine for a demo.)
  async geocode(query) {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await json(res);
    return data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  },
};
