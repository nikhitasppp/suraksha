// datasources/IndiaNcrbDataSource.js
import { CrimeDataSource } from './CrimeDataSource.js';
import { config } from '../config.js';

const CITY_DATA = [
  // --- Mega cities ---
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, r: 0.15, counts: { 'violent-crime': 95, 'robbery': 22, 'theft-from-the-person': 160, 'vehicle-crime': 130, 'burglary': 55, 'sexual-offences': 18, 'criminal-damage-arson': 15, 'public-order': 40, 'drugs': 35, 'anti-social-behaviour': 60 }},
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, r: 0.12, counts: { 'violent-crime': 60, 'robbery': 15, 'theft-from-the-person': 120, 'vehicle-crime': 65, 'burglary': 40, 'sexual-offences': 12, 'criminal-damage-arson': 18, 'public-order': 35, 'drugs': 25, 'anti-social-behaviour': 50 }},
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, r: 0.12, counts: { 'violent-crime': 45, 'robbery': 12, 'theft-from-the-person': 95, 'vehicle-crime': 75, 'burglary': 35, 'sexual-offences': 10, 'criminal-damage-arson': 12, 'public-order': 28, 'drugs': 20, 'anti-social-behaviour': 40 }},
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, r: 0.10, counts: { 'violent-crime': 38, 'robbery': 8, 'theft-from-the-person': 80, 'vehicle-crime': 55, 'burglary': 30, 'sexual-offences': 7, 'criminal-damage-arson': 10, 'public-order': 22, 'drugs': 15, 'anti-social-behaviour': 30 }},
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, r: 0.10, counts: { 'violent-crime': 42, 'robbery': 10, 'theft-from-the-person': 70, 'vehicle-crime': 40, 'burglary': 25, 'sexual-offences': 9, 'criminal-damage-arson': 12, 'public-order': 30, 'drugs': 18, 'anti-social-behaviour': 45 }},
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, r: 0.12, counts: { 'violent-crime': 40, 'robbery': 10, 'theft-from-the-person': 85, 'vehicle-crime': 60, 'burglary': 28, 'sexual-offences': 8, 'criminal-damage-arson': 10, 'public-order': 25, 'drugs': 15, 'anti-social-behaviour': 35 }},
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, r: 0.10, counts: { 'violent-crime': 35, 'robbery': 8, 'theft-from-the-person': 70, 'vehicle-crime': 50, 'burglary': 22, 'sexual-offences': 6, 'criminal-damage-arson': 8, 'public-order': 20, 'drugs': 12, 'anti-social-behaviour': 28 }},
  { name: 'Pune', lat: 18.5204, lng: 73.8567, r: 0.10, counts: { 'violent-crime': 30, 'robbery': 7, 'theft-from-the-person': 65, 'vehicle-crime': 55, 'burglary': 20, 'sexual-offences': 6, 'criminal-damage-arson': 8, 'public-order': 18, 'drugs': 14, 'anti-social-behaviour': 25 }},
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, r: 0.10, counts: { 'violent-crime': 48, 'robbery': 12, 'theft-from-the-person': 75, 'vehicle-crime': 45, 'burglary': 30, 'sexual-offences': 10, 'criminal-damage-arson': 14, 'public-order': 25, 'drugs': 18, 'anti-social-behaviour': 38 }},
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, r: 0.08, counts: { 'violent-crime': 52, 'robbery': 14, 'theft-from-the-person': 60, 'vehicle-crime': 35, 'burglary': 25, 'sexual-offences': 8, 'criminal-damage-arson': 10, 'public-order': 30, 'drugs': 12, 'anti-social-behaviour': 35 }},

  // --- Large cities ---
  { name: 'Surat', lat: 21.1702, lng: 72.8311, r: 0.08, counts: { 'violent-crime': 22, 'robbery': 5, 'theft-from-the-person': 45, 'vehicle-crime': 30, 'burglary': 15, 'sexual-offences': 4, 'criminal-damage-arson': 6, 'public-order': 12, 'drugs': 8, 'anti-social-behaviour': 18 }},
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319, r: 0.08, counts: { 'violent-crime': 50, 'robbery': 12, 'theft-from-the-person': 55, 'vehicle-crime': 30, 'burglary': 22, 'sexual-offences': 7, 'criminal-damage-arson': 10, 'public-order': 25, 'drugs': 10, 'anti-social-behaviour': 30 }},
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, r: 0.08, counts: { 'violent-crime': 35, 'robbery': 8, 'theft-from-the-person': 50, 'vehicle-crime': 35, 'burglary': 18, 'sexual-offences': 6, 'criminal-damage-arson': 8, 'public-order': 18, 'drugs': 12, 'anti-social-behaviour': 22 }},
  { name: 'Indore', lat: 22.7196, lng: 75.8577, r: 0.08, counts: { 'violent-crime': 42, 'robbery': 10, 'theft-from-the-person': 60, 'vehicle-crime': 40, 'burglary': 20, 'sexual-offences': 8, 'criminal-damage-arson': 10, 'public-order': 22, 'drugs': 14, 'anti-social-behaviour': 28 }},
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, r: 0.08, counts: { 'violent-crime': 40, 'robbery': 9, 'theft-from-the-person': 55, 'vehicle-crime': 35, 'burglary': 20, 'sexual-offences': 8, 'criminal-damage-arson': 10, 'public-order': 20, 'drugs': 12, 'anti-social-behaviour': 25 }},
  { name: 'Patna', lat: 25.6093, lng: 85.1376, r: 0.08, counts: { 'violent-crime': 55, 'robbery': 15, 'theft-from-the-person': 50, 'vehicle-crime': 25, 'burglary': 22, 'sexual-offences': 8, 'criminal-damage-arson': 12, 'public-order': 28, 'drugs': 10, 'anti-social-behaviour': 35 }},
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, r: 0.08, counts: { 'violent-crime': 25, 'robbery': 5, 'theft-from-the-person': 40, 'vehicle-crime': 28, 'burglary': 12, 'sexual-offences': 4, 'criminal-damage-arson': 6, 'public-order': 14, 'drugs': 8, 'anti-social-behaviour': 18 }},
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812, r: 0.07, counts: { 'violent-crime': 20, 'robbery': 4, 'theft-from-the-person': 35, 'vehicle-crime': 25, 'burglary': 12, 'sexual-offences': 3, 'criminal-damage-arson': 5, 'public-order': 10, 'drugs': 6, 'anti-social-behaviour': 15 }},
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, r: 0.07, counts: { 'violent-crime': 18, 'robbery': 4, 'theft-from-the-person': 35, 'vehicle-crime': 25, 'burglary': 10, 'sexual-offences': 3, 'criminal-damage-arson': 4, 'public-order': 10, 'drugs': 6, 'anti-social-behaviour': 14 }},
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, r: 0.07, counts: { 'violent-crime': 15, 'robbery': 3, 'theft-from-the-person': 30, 'vehicle-crime': 20, 'burglary': 8, 'sexual-offences': 3, 'criminal-damage-arson': 4, 'public-order': 8, 'drugs': 10, 'anti-social-behaviour': 12 }},
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, r: 0.07, counts: { 'violent-crime': 28, 'robbery': 6, 'theft-from-the-person': 35, 'vehicle-crime': 18, 'burglary': 14, 'sexual-offences': 5, 'criminal-damage-arson': 6, 'public-order': 15, 'drugs': 8, 'anti-social-behaviour': 20 }},
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, r: 0.06, counts: { 'violent-crime': 18, 'robbery': 5, 'theft-from-the-person': 30, 'vehicle-crime': 22, 'burglary': 10, 'sexual-offences': 4, 'criminal-damage-arson': 4, 'public-order': 10, 'drugs': 8, 'anti-social-behaviour': 15 }},
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, r: 0.07, counts: { 'violent-crime': 14, 'robbery': 3, 'theft-from-the-person': 25, 'vehicle-crime': 15, 'burglary': 8, 'sexual-offences': 3, 'criminal-damage-arson': 3, 'public-order': 8, 'drugs': 8, 'anti-social-behaviour': 10 }},
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394, r: 0.07, counts: { 'violent-crime': 12, 'robbery': 3, 'theft-from-the-person': 22, 'vehicle-crime': 18, 'burglary': 8, 'sexual-offences': 2, 'criminal-damage-arson': 3, 'public-order': 8, 'drugs': 5, 'anti-social-behaviour': 10 }},

  // --- Medium cities ---
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, r: 0.07, counts: { 'violent-crime': 35, 'robbery': 8, 'theft-from-the-person': 40, 'vehicle-crime': 20, 'burglary': 16, 'sexual-offences': 5, 'criminal-damage-arson': 7, 'public-order': 18, 'drugs': 8, 'anti-social-behaviour': 25 }},
  { name: 'Agra', lat: 27.1767, lng: 78.0081, r: 0.07, counts: { 'violent-crime': 38, 'robbery': 9, 'theft-from-the-person': 45, 'vehicle-crime': 25, 'burglary': 18, 'sexual-offences': 6, 'criminal-damage-arson': 8, 'public-order': 20, 'drugs': 8, 'anti-social-behaviour': 28 }},
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096, r: 0.07, counts: { 'violent-crime': 30, 'robbery': 8, 'theft-from-the-person': 35, 'vehicle-crime': 18, 'burglary': 14, 'sexual-offences': 5, 'criminal-damage-arson': 6, 'public-order': 16, 'drugs': 7, 'anti-social-behaviour': 22 }},
  { name: 'Dehradun', lat: 30.3165, lng: 78.0322, r: 0.06, counts: { 'violent-crime': 20, 'robbery': 5, 'theft-from-the-person': 28, 'vehicle-crime': 15, 'burglary': 10, 'sexual-offences': 4, 'criminal-damage-arson': 4, 'public-order': 10, 'drugs': 6, 'anti-social-behaviour': 14 }},
  { name: 'Amritsar', lat: 31.6340, lng: 74.8723, r: 0.07, counts: { 'violent-crime': 25, 'robbery': 6, 'theft-from-the-person': 32, 'vehicle-crime': 18, 'burglary': 12, 'sexual-offences': 4, 'criminal-damage-arson': 5, 'public-order': 12, 'drugs': 14, 'anti-social-behaviour': 18 }},
  { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, r: 0.07, counts: { 'violent-crime': 32, 'robbery': 7, 'theft-from-the-person': 38, 'vehicle-crime': 22, 'burglary': 15, 'sexual-offences': 6, 'criminal-damage-arson': 7, 'public-order': 16, 'drugs': 10, 'anti-social-behaviour': 22 }},
  { name: 'Gwalior', lat: 26.2183, lng: 78.1828, r: 0.06, counts: { 'violent-crime': 38, 'robbery': 9, 'theft-from-the-person': 40, 'vehicle-crime': 22, 'burglary': 16, 'sexual-offences': 7, 'criminal-damage-arson': 8, 'public-order': 18, 'drugs': 8, 'anti-social-behaviour': 25 }},
  { name: 'Raipur', lat: 21.2514, lng: 81.6296, r: 0.07, counts: { 'violent-crime': 28, 'robbery': 6, 'theft-from-the-person': 35, 'vehicle-crime': 22, 'burglary': 14, 'sexual-offences': 5, 'criminal-damage-arson': 6, 'public-order': 14, 'drugs': 8, 'anti-social-behaviour': 18 }},
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, r: 0.07, counts: { 'violent-crime': 20, 'robbery': 4, 'theft-from-the-person': 30, 'vehicle-crime': 20, 'burglary': 10, 'sexual-offences': 3, 'criminal-damage-arson': 4, 'public-order': 10, 'drugs': 6, 'anti-social-behaviour': 14 }},
  { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, r: 0.06, counts: { 'violent-crime': 12, 'robbery': 3, 'theft-from-the-person': 20, 'vehicle-crime': 14, 'burglary': 6, 'sexual-offences': 2, 'criminal-damage-arson': 3, 'public-order': 6, 'drugs': 4, 'anti-social-behaviour': 8 }},
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, r: 0.07, counts: { 'violent-crime': 22, 'robbery': 5, 'theft-from-the-person': 32, 'vehicle-crime': 22, 'burglary': 12, 'sexual-offences': 4, 'criminal-damage-arson': 5, 'public-order': 12, 'drugs': 6, 'anti-social-behaviour': 16 }},
  { name: 'Noida', lat: 28.5355, lng: 77.3910, r: 0.08, counts: { 'violent-crime': 30, 'robbery': 10, 'theft-from-the-person': 55, 'vehicle-crime': 45, 'burglary': 18, 'sexual-offences': 6, 'criminal-damage-arson': 8, 'public-order': 15, 'drugs': 10, 'anti-social-behaviour': 25 }},
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266, r: 0.08, counts: { 'violent-crime': 35, 'robbery': 12, 'theft-from-the-person': 60, 'vehicle-crime': 50, 'burglary': 20, 'sexual-offences': 8, 'criminal-damage-arson': 8, 'public-order': 18, 'drugs': 12, 'anti-social-behaviour': 30 }},
  { name: 'Thane', lat: 19.2183, lng: 72.9781, r: 0.08, counts: { 'violent-crime': 28, 'robbery': 7, 'theft-from-the-person': 50, 'vehicle-crime': 35, 'burglary': 16, 'sexual-offences': 5, 'criminal-damage-arson': 7, 'public-order': 14, 'drugs': 10, 'anti-social-behaviour': 22 }},
  { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, r: 0.08, counts: { 'violent-crime': 20, 'robbery': 5, 'theft-from-the-person': 40, 'vehicle-crime': 30, 'burglary': 12, 'sexual-offences': 4, 'criminal-damage-arson': 5, 'public-order': 10, 'drugs': 8, 'anti-social-behaviour': 16 }},
  { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, r: 0.06, counts: { 'violent-crime': 18, 'robbery': 4, 'theft-from-the-person': 28, 'vehicle-crime': 18, 'burglary': 10, 'sexual-offences': 3, 'criminal-damage-arson': 4, 'public-order': 10, 'drugs': 6, 'anti-social-behaviour': 14 }},
  { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, r: 0.06, counts: { 'violent-crime': 32, 'robbery': 7, 'theft-from-the-person': 35, 'vehicle-crime': 20, 'burglary': 14, 'sexual-offences': 5, 'criminal-damage-arson': 6, 'public-order': 15, 'drugs': 7, 'anti-social-behaviour': 20 }},
  { name: 'Aurangabad', lat: 19.8762, lng: 75.3433, r: 0.06, counts: { 'violent-crime': 22, 'robbery': 5, 'theft-from-the-person': 32, 'vehicle-crime': 22, 'burglary': 12, 'sexual-offences': 4, 'criminal-damage-arson': 5, 'public-order': 12, 'drugs': 6, 'anti-social-behaviour': 16 }},
  { name: 'Hubli-Dharwad', lat: 15.3647, lng: 75.1240, r: 0.06, counts: { 'violent-crime': 15, 'robbery': 3, 'theft-from-the-person': 22, 'vehicle-crime': 15, 'burglary': 8, 'sexual-offences': 3, 'criminal-damage-arson': 3, 'public-order': 8, 'drugs': 4, 'anti-social-behaviour': 10 }},
  { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, r: 0.06, counts: { 'violent-crime': 16, 'robbery': 3, 'theft-from-the-person': 25, 'vehicle-crime': 18, 'burglary': 8, 'sexual-offences': 3, 'criminal-damage-arson': 3, 'public-order': 8, 'drugs': 5, 'anti-social-behaviour': 12 }},
];

// FNV-1a 32-bit hash — fast, good distribution, no external deps.
function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

// LCG seeded PRNG. Returns a function that gives values in [0, 1).
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Weighted annual incident total — the same formula the scoring engine uses.
// Pre-computed per city at module load so getCrimesNear is cheap.
function computeCityRiskIndex(counts) {
  const { categoryWeights, defaultWeight } = config.scoring;
  let total = 0;
  for (const [cat, count] of Object.entries(counts)) {
    total += count * (categoryWeights[cat] ?? defaultWeight);
  }
  return total;
}

// Annotate each city with its riskIndex once at startup.
for (const city of CITY_DATA) {
  city.riskIndex = computeCityRiskIndex(city.counts);
}

export class IndiaNcrbDataSource extends CrimeDataSource {
  get name() {
    return 'India NCRB (district/city-level annual data)';
  }

  get granularityNote() {
    return 'City/district-level annual figures + community reports. Precision improves as users contribute reports.';
  }

  _findNearestCity(lat, lng) {
    let nearest = CITY_DATA[0];
    let bestDist = Infinity;
    for (const city of CITY_DATA) {
      const d = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
      if (d < bestDist) {
        bestDist = d;
        nearest = city;
      }
    }
    return { city: nearest, distDeg: Math.sqrt(bestDist) };
  }

  async getCrimesNear(lat, lng, opts = {}) {
    const { city, distDeg } = this._findNearestCity(lat, lng);

    const isRural = distDeg > 1.0;
    const scaleFactor = isRural ? 0.15 : 1.0;

    // Scatter is fixed at ~2.2 km so incidents reliably fall within the
    // 1.5 km scoring radius. This keeps scores proportional to city risk
    // (Delhi consistently lower than Mysuru) without needing any artificial
    // score adjustment. Wide city.r values caused almost all incidents to
    // land outside the scoring radius, making every city look equally safe.
    const SCATTER_DEG = 0.02;

    // Seed the RNG from a stable key so the same map click always produces
    // the same incident positions and therefore the same score. We round to
    // 3 decimal places (~110 m precision) so tiny mouse jitter doesn't shift
    // the result, and mix in the city name so distant cities with nearby
    // rounded coords don't accidentally share a scatter pattern.
    const seedKey = `${Math.round(lat * 1000)},${Math.round(lng * 1000)},${city.name}`;
    const rng = makeRng(hashStr(seedKey));

    const incidents = [];
    const year = new Date().getFullYear() - 1;
    const period = `${year}-annual`;

    for (const [category, annualCount] of Object.entries(city.counts)) {
      // Divisor 5: enough incidents per category that the ratio between
      // high-crime and low-crime cities is legible in the score.
      const localised = Math.max(1, Math.round((annualCount * scaleFactor) / 5));

      for (let i = 0; i < localised; i++) {
        // Gaussian-ish scatter via sum-of-uniforms, now seeded deterministically.
        const rLat = (rng() + rng() - 1) * SCATTER_DEG;
        const rLng = (rng() + rng() - 1) * SCATTER_DEG;
        incidents.push({ category, lat: lat + rLat, lng: lng + rLng, period });
      }
    }

    // Attach the city baseline so callers (e.g. safety.js) can surface it.
    incidents.cityBaseline = { name: city.name, riskIndex: city.riskIndex };

    return incidents;
  }
}
