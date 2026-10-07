// routes/reports.js
import express from 'express';
import { repository } from '../store/jsonStore.js';
import { haversineKm } from '../utils/geo.js';

const router = express.Router();
const reports = repository('reports');

const REPORT_TYPES = [
  'poor-lighting',
  'harassment',
  'feels-unsafe',
  'stalking',
  'no-people-around',
  'broken-infrastructure',
  'other',
];

// ---------------------------------------------------------------------------
// Rate limiting — in-memory, per (IP + rounded lat/lng), max 3/hour.
// Rounding to 3 decimal places (~110 m) prevents trivial bypass by tiny
// coordinate drift.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 3;

function checkRateLimit(ip, lat, lng) {
  const rLat = (Math.round(lat * 1000) / 1000).toFixed(3);
  const rLng = (Math.round(lng * 1000) / 1000).toFixed(3);
  const key = `${ip}|${rLat}|${rLng}`;
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => t > cutoff);
  if (timestamps.length >= RATE_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

// ---------------------------------------------------------------------------
// Corroboration — a report is "verified" if at least one other report of the
// same type exists within 500 m and 7 days of it in the full collection.
// ---------------------------------------------------------------------------
const CORROBORATION_RADIUS_KM = 0.5;
const CORROBORATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function computeVerified(allReports) {
  const verified = new Set();
  for (const r of allReports) {
    if (verified.has(r.id)) continue;
    const rTime = new Date(r.createdAt).getTime();
    const peer = allReports.find(
      (other) =>
        other.id !== r.id &&
        other.type === r.type &&
        Math.abs(new Date(other.createdAt).getTime() - rTime) <= CORROBORATION_WINDOW_MS &&
        haversineKm(r.lat, r.lng, other.lat, other.lng) <= CORROBORATION_RADIUS_KM
    );
    if (peer) {
      verified.add(r.id);
      verified.add(peer.id);
    }
  }
  return verified;
}

// GET /api/reports?lat=..&lng=..&radiusKm=2
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 2;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  const all = await reports.all();
  const verifiedIds = computeVerified(all);
  const nearby = all
    .filter((r) => haversineKm(lat, lng, r.lat, r.lng) <= radiusKm)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((r) => ({ ...r, verified: verifiedIds.has(r.id) }));
  res.json(nearby);
});

// POST /api/reports  { lat, lng, type, note }
router.post('/', async (req, res) => {
  const { lat, lng, type, note } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }
  if (!REPORT_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${REPORT_TYPES.join(', ')}` });
  }

  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip, lat, lng)) {
    return res.status(429).json({
      error: 'Too many reports from this location. Maximum 3 reports per area per hour.',
    });
  }

  const record = await reports.insert({
    lat,
    lng,
    type,
    note: typeof note === 'string' ? note.slice(0, 280) : '',
  });
  res.status(201).json({ ...record, verified: false });
});

router.get('/types', (_req, res) => res.json(REPORT_TYPES));

export default router;
