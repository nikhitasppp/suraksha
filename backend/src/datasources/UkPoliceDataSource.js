// datasources/UkPoliceDataSource.js
// Real implementation backed by https://data.police.uk (free, no key).
// This is what powers the live demo: genuine street-level, geocoded crime data.

import { CrimeDataSource } from './CrimeDataSource.js';
import { config } from '../config.js';
import { TtlCache } from '../utils/geo.js';

export class UkPoliceDataSource extends CrimeDataSource {
  constructor() {
    super();
    this._cache = new TtlCache(config.upstreamCacheTtlMs);
    this._latestMonth = null; // resolved lazily, then cached
  }

  get name() {
    return 'UK Police (data.police.uk)';
  }

  get granularityNote() {
    return 'Street-level incidents within ~1 mile, updated monthly.';
  }

  /**
   * The dataset lags real time by a month or two, and the exact latest month
   * shifts. We ask the API which month it last updated rather than guessing,
   * so the demo never silently queries an empty month.
   */
  async _getLatestMonth() {
    if (this._latestMonth) return this._latestMonth;
    try {
      const res = await fetch(`${config.ukPoliceApiBase}/crime-last-updated`);
      if (res.ok) {
        const body = await res.json();
        // body.date looks like "2024-01-01"; we want "2024-01".
        if (body?.date) this._latestMonth = body.date.slice(0, 7);
      }
    } catch {
      // fall through to fallback below
    }
    if (!this._latestMonth) {
      // Fallback: ~2 months back from today, which the dataset usually covers.
      const d = new Date();
      d.setMonth(d.getMonth() - 2);
      this._latestMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return this._latestMonth;
  }

  async getCrimesNear(lat, lng, opts = {}) {
    const month = await this._getLatestMonth();
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${month}`;
    const cached = this._cache.get(cacheKey);
    if (cached) return cached;

    // crimes-street/all-crime returns every crime within ~1 mile of the point.
    const url =
      `${config.ukPoliceApiBase}/crimes-street/all-crime` +
      `?lat=${lat}&lng=${lng}&date=${month}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`UK police API responded ${res.status}`);
    }
    const raw = await res.json();

    const incidents = (raw || [])
      .filter((c) => c?.location?.latitude && c?.location?.longitude)
      .map((c) => ({
        category: c.category || 'other-crime',
        lat: parseFloat(c.location.latitude),
        lng: parseFloat(c.location.longitude),
        period: c.month || month,
      }));

    this._cache.set(cacheKey, incidents);
    return incidents;
  }
}
