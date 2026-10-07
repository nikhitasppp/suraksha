// datasources/CrimeDataSource.js
// -----------------------------------------------------------------------------
// The CONTRACT every crime-data provider must satisfy. This is the seam that
// makes the project credible: the safety-scoring logic never knows or cares
// whether the numbers came from UK police, India's NCRB, or a future provider.
// It only knows it gets back a list of NormalisedIncident objects.
//
// This is the single most important design idea in the codebase. When an
// interviewer asks "how would you handle India's poor crime-data availability?"
// the answer is: "I coded against this interface and swapped the implementation."
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} NormalisedIncident
 * @property {string} category   - Crime category, normalised to the UK taxonomy
 *                                  (e.g. "violent-crime"). Lets one scoring model
 *                                  work across providers.
 * @property {number} lat
 * @property {number} lng
 * @property {string} period     - "YYYY-MM" the incident was reported in.
 */

export class CrimeDataSource {
  /** Human-readable name, surfaced to the UI so users know the data's origin. */
  get name() {
    throw new Error('CrimeDataSource.name must be implemented');
  }

  /**
   * Granularity disclaimer shown in the UI. Honesty about data quality is a
   * feature, not an apology — it's also defensible in an interview.
   */
  get granularityNote() {
    throw new Error('CrimeDataSource.granularityNote must be implemented');
  }

  /**
   * Return incidents near a point.
   * @param {number} lat
   * @param {number} lng
   * @param {{ radiusKm?: number }} [opts]
   * @returns {Promise<NormalisedIncident[]>}
   */
  async getCrimesNear(_lat, _lng, _opts) {
    throw new Error('CrimeDataSource.getCrimesNear must be implemented');
  }
}
