// services/safetyScore.js
// -----------------------------------------------------------------------------
// The signature feature: turn a pile of nearby incidents into a 0–100 safety
// score. The guiding principle is EXPLAINABILITY. Every number can be traced,
// so when an interviewer asks "why is this area 72 and not 60?", you can answer
// precisely. A score you can't explain is worse than no score.
//
// Pipeline:
//   1. Filter incidents to the radius.
//   2. Weight each by category severity (a mugging != a bike theft).
//   3. Sum into a single "risk load".
//   4. Apply a time-of-day risk boost (night is riskier than midday).
//   5. Map risk -> 0..100 with a smooth exponential decay (more crime = lower
//      score, with diminishing additional penalty so one bad street doesn't
//      instantly read as 0).
//
// Output includes the full breakdown so the UI — and you — can see the workings.
// -----------------------------------------------------------------------------

import { config } from '../config.js';
import { haversineKm } from '../utils/geo.js';

const { categoryWeights, defaultWeight, sensitivity, nightRiskBoost, nightStartHour, nightEndHour } =
  config.scoring;

function isNight(hour) {
  if (hour == null) return false;
  // Wraps around midnight: e.g. 20:00–06:00.
  return hour >= nightStartHour || hour < nightEndHour;
}

function ratingFromScore(score) {
  if (score >= 80) return 'Safe';
  if (score >= 60) return 'Mostly safe';
  if (score >= 40) return 'Use caution';
  if (score >= 20) return 'Risky';
  return 'High risk';
}

/**
 * @param {import('../datasources/CrimeDataSource.js').NormalisedIncident[]} incidents
 * @param {number} centerLat
 * @param {number} centerLng
 * @param {{ radiusKm: number, hour?: number }} opts
 */
export function computeSafetyScore(incidents, centerLat, centerLng, opts) {
  const radiusKm = opts.radiusKm ?? config.scoring.radiusKm;
  const hour = opts.hour;

  // 1. Filter to radius.
  const inRange = incidents.filter(
    (i) => haversineKm(centerLat, centerLng, i.lat, i.lng) <= radiusKm
  );

  // 2 + 3. Weighted risk load + per-category tally for the breakdown.
  const byCategory = {};
  let riskLoad = 0;
  for (const inc of inRange) {
    const w = categoryWeights[inc.category] ?? defaultWeight;
    riskLoad += w;
    if (!byCategory[inc.category]) {
      byCategory[inc.category] = { category: inc.category, count: 0, weight: w };
    }
    byCategory[inc.category].count += 1;
  }

  // 4. Time-of-day adjustment.
  const night = isNight(hour);
  const adjustedRisk = night ? riskLoad * (1 + nightRiskBoost) : riskLoad;

  // 5. Risk -> score. exp decay keeps the score bounded and smooth.
  const rawScore = 100 * Math.exp(-adjustedRisk / sensitivity);
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Sort breakdown by contribution (count * weight) so the biggest drivers
  // surface first in the UI.
  const breakdown = Object.values(byCategory)
    .map((c) => ({ ...c, contribution: +(c.count * c.weight).toFixed(1) }))
    .sort((a, b) => b.contribution - a.contribution);

  return {
    score,
    rating: ratingFromScore(score),
    incidentCount: inRange.length,
    radiusKm,
    timeOfDay: hour == null ? 'unspecified' : night ? 'night' : 'day',
    nightAdjustmentApplied: night,
    breakdown,
  };
}
