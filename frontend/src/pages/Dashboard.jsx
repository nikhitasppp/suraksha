import { useCallback, useEffect, useState } from 'react';
import MapView from '../components/MapView.jsx';
import { api } from '../api.js';

// Default center: India (Bhopal is roughly the geographic center)
const DEFAULT_CENTER = [22.7196, 77.4126];

const QUICK_CITIES = [
  { label: 'Delhi', center: [28.6139, 77.2090] },
  { label: 'Mumbai', center: [19.0760, 72.8777] },
  { label: 'Bengaluru', center: [12.9716, 77.5946] },
  { label: 'Chennai', center: [13.0827, 80.2707] },
  { label: 'Kolkata', center: [22.5726, 88.3639] },
  { label: 'Hyderabad', center: [17.3850, 78.4867] },
  { label: 'Mysuru', center: [12.2958, 76.6394] },
  { label: 'Pune', center: [18.5204, 73.8567] },
];

function gaugeColor(s) {
  if (s >= 75) return '#2dd4a8';
  if (s >= 50) return '#86efac';
  if (s >= 35) return '#fbbf24';
  if (s >= 15) return '#fb923c';
  return '#ff5a6e';
}

function breakdownGradient(cat) {
  const SEVERE = new Set(['violent-crime', 'robbery', 'sexual-offences', 'possession-of-weapons']);
  if (SEVERE.has(cat)) return 'linear-gradient(90deg, #ff5a6e, #ff1744)';
  return 'linear-gradient(90deg, #fbbf24, #ff9933)';
}

export default function Dashboard() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [selected, setSelected] = useState(null);
  const [safety, setSafety] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const assess = useCallback(async (lat, lng) => {
    setSelected([lat, lng]);
    setCenter([lat, lng]);
    setLoading(true);
    setError('');
    setSafety(null);
    try {
      const hour = new Date().getHours();
      const [s, r] = await Promise.all([
        api.getSafety(lat, lng, hour),
        api.getReports(lat, lng, 2).catch(() => []),
      ]);
      setSafety(s);
      setIncidents(s.incidents || []);
      setReports(r);
    } catch (e) {
      setError(e.message || 'Failed to assess area');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    const t = setTimeout(() => {
      api.geocode(query).then(setResults).catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const score = safety?.score ?? null;
  const color = score !== null ? gaugeColor(score) : '#60a5fa';
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = score !== null ? (score / 100) * c : 0;
  const maxContrib = safety?.breakdown?.length
    ? Math.max(1, ...safety.breakdown.map((b) => b.contribution))
    : 1;

  return (
    <div className="dashboard">
      <div className="dash-map">
        <MapView
          center={center}
          zoom={selected ? 14 : 5}
          selected={selected}
          incidents={incidents}
          reports={reports}
          onPick={assess}
        />
        {!selected && (
          <div className="map-hint">
            <span className="material-icons-round">touch_app</span>
            Tap anywhere on the map to check that area's safety
          </div>
        )}
      </div>

      <div className="dash-side">
        {/* Search */}
        <div className="search-box">
          <span className="material-icons-round search-icon">search</span>
          <input
            placeholder="Search a city, area, or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="search-results">
              {results.map((r, i) => (
                <button key={i} onClick={() => {
                  assess(r.lat, r.lng);
                  setResults([]);
                  setQuery(r.label.split(',')[0]);
                }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick city chips */}
        <div className="chips">
          {QUICK_CITIES.map((c) => (
            <button key={c.label} className="chip" onClick={() => {
              assess(c.center[0], c.center[1]);
              setQuery(c.label);
            }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card">
            <div className="card-title">
              <span className="material-icons-round">radar</span>
              Analysing area…
            </div>
            <p className="muted">Pulling crime data and computing safety score.</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="card">
            <div className="card-title">
              <span className="material-icons-round">error_outline</span>
              Couldn't score this area
            </div>
            <p className="error-msg">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!selected && !loading && (
          <div className="empty-state">
            <span className="material-icons-round">map</span>
            <p>Select a location on the map or search for a city to see its safety score</p>
          </div>
        )}

        {/* Safety score */}
        {safety && !loading && (
          <div className="card">
            <div className="card-title">
              <span className="material-icons-round">shield</span>
              Area Safety
            </div>

            <div className="safety-hero">
              <div className="gauge">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r={r} stroke="#1f2b45" strokeWidth="10" fill="none" />
                  <circle
                    cx="65" cy="65" r={r}
                    stroke={color}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c - dash}`}
                    style={{ transition: 'stroke-dasharray 0.7s ease, stroke 0.4s ease' }}
                  />
                </svg>
                <div className="center-label">
                  <span className="big-num" style={{ color }}>{score}</span>
                  <span className="of-100">/ 100</span>
                </div>
              </div>
              <div className="safety-meta">
                <div className="rating-word" style={{ color }}>{safety.rating}</div>
                <div className="rating-detail">
                  {safety.incidentCount} incident{safety.incidentCount === 1 ? '' : 's'} within {safety.radiusKm} km
                  {safety.nightAdjustmentApplied && (
                    <span className="text-amber"> · night risk applied</span>
                  )}
                </div>
                {safety.communitySignal?.recentReportCount > 0 && (
                  <div className="rating-detail text-saffron">
                    {safety.communitySignal.recentReportCount} community report{safety.communitySignal.recentReportCount === 1 ? '' : 's'} nearby
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown */}
            {safety.breakdown?.length > 0 && (
              <div>
                <p className="muted mb small" style={{ fontWeight: 600 }}>SCORE BREAKDOWN</p>
                {safety.breakdown.slice(0, 7).map((b) => (
                  <div className="breakdown-row" key={b.category}>
                    <span className="cat-label">{b.category.replace(/-/g, ' ')}</span>
                    <span className="breakdown-track">
                      <span
                        className="breakdown-fill"
                        style={{
                          width: `${(b.contribution / maxContrib) * 100}%`,
                          background: breakdownGradient(b.category),
                        }}
                      />
                    </span>
                    <span className="cat-count">{b.count}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="source-note">
              Source: {safety.dataSource?.name} · {safety.dataSource?.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
