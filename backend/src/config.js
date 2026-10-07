// config.js
// -----------------------------------------------------------------------------
// All environment-tunable settings live here, in ONE place. This matters for an
// interview: "Where do I change the data source or the scoring weights?" has a
// single, obvious answer. Nothing is hard-coded deep inside business logic.
// -----------------------------------------------------------------------------

export const config = {
  port: process.env.PORT || 4000,

  // Which crime-data backend to use. The whole point of the datasources/ folder
  // is that this is the ONLY line you change to swap data providers.
  //   "uk"    -> real street-level data from data.police.uk (free, no API key)
  //   "india" -> NCRB district-level data (stubbed; see IndiaNcrbDataSource.js)
  dataSource: process.env.DATA_SOURCE || 'india',

  // --- Safety-score model knobs --------------------------------------------
  scoring: {
    radiusKm: 1.5,

    // Severity weights per crime category. Violent crime hurts the score far
    // more than, say, bicycle theft. Categories follow the UK police taxonomy;
    // anything unlisted falls back to `defaultWeight`.
    categoryWeights: {
      'violent-crime': 5.0,
      'robbery': 4.5,
      'possession-of-weapons': 4.0,
      'sexual-offences': 5.0,
      'burglary': 3.0,
      'theft-from-the-person': 3.0,
      'vehicle-crime': 2.0,
      'criminal-damage-arson': 2.5,
      'drugs': 1.5,
      'public-order': 2.0,
      'anti-social-behaviour': 1.5,
      'shoplifting': 1.0,
      'bicycle-theft': 1.0,
      'other-theft': 1.5,
      'other-crime': 1.5,
    },
    defaultWeight: 2.0,

    // Controls how quickly the score falls as weighted incidents pile up.
    // score = 100 * exp(-weightedTotal / sensitivity). Higher = more forgiving.
    sensitivity: 200,

    // Night feels less safe than midday for the same street. We apply a small
    // multiplier to the *risk* after sunset / before dawn. 0.25 = +25% risk.
    nightRiskBoost: 0.25,
    nightStartHour: 20, // 8 PM
    nightEndHour: 6, // 6 AM
  },

  // External services (all free, no key required).
  ukPoliceApiBase: 'https://data.police.uk/api',
  overpassApiBase: 'https://overpass-api.de/api/interpreter',

  // How long to cache an upstream crime lookup (ms). Keeps us under rate limits
  // and makes repeated map pans snappy.
  upstreamCacheTtlMs: 5 * 60 * 1000,
};
