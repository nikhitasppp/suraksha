// routes/safety.js
import express from 'express';
import { getDataSource } from '../datasources/index.js';
import { computeSafetyScore } from '../services/safetyScore.js';
import { config } from '../config.js';
import { repository } from '../store/jsonStore.js';
import { haversineKm } from '../utils/geo.js';
import { computeVerified } from './reports.js';

const router = express.Router();
const reports = repository('reports');

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const hour = req.query.hour != null ? parseInt(req.query.hour, 10) : undefined;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng query params are required numbers' });
  }

  const source = getDataSource();
  const radiusKm = config.scoring.radiusKm;

  try {
    const incidents = await source.getCrimesNear(lat, lng, { radiusKm });
    const cityBaseline = incidents.cityBaseline || null;
    const result = computeSafetyScore(incidents, lat, lng, { radiusKm, hour });

    // Fold in community reports from the last 30 days within the radius.
    // Only corroborated clusters (2+ reports of the same type within 500 m
    // and 7 days) count toward the penalty — lone reports remain visible but
    // do not penalise the score.
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const allReports = await reports.all();
    const verifiedIds = computeVerified(allReports);

    const nearbyReports = allReports
      .filter(
        (r) =>
          new Date(r.createdAt).getTime() >= since &&
          haversineKm(lat, lng, r.lat, r.lng) <= radiusKm
      )
      .map((r) => ({ ...r, verified: verifiedIds.has(r.id) }));

    const verifiedNearby = nearbyReports.filter((r) => r.verified);
    const communityPenalty = Math.min(15, verifiedNearby.length * 2); // capped
    const adjustedScore = Math.max(0, result.score - communityPenalty);

    res.json({
      ...result,
      score: adjustedScore,
      communitySignal: {
        recentReportCount: nearbyReports.length,
        verifiedReportCount: verifiedNearby.length,
        penaltyApplied: communityPenalty,
      },
      cityBaseline,
      dataSource: { name: source.name, note: source.granularityNote },
      incidents: incidents
        .filter((i) => haversineKm(lat, lng, i.lat, i.lng) <= radiusKm)
        .slice(0, 400)
        .map((i) => ({ lat: i.lat, lng: i.lng, category: i.category })),
    });
  } catch (err) {
    console.error('safety lookup failed:', err.message);
    res.status(502).json({
      error: 'Could not retrieve crime data for this location right now.',
      detail: err.message,
    });
  }
});

export default router;
