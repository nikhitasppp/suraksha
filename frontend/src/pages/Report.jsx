import { useEffect, useState } from 'react';
import MapView from '../components/MapView.jsx';
import { api } from '../api.js';

const REPORT_ICONS = {
  'poor-lighting': 'lightbulb',
  'harassment': 'report',
  'feels-unsafe': 'warning',
  'stalking': 'visibility',
  'no-people-around': 'person_off',
  'broken-infrastructure': 'construction',
  'other': 'more_horiz',
};

export default function Report() {
  const [types, setTypes] = useState([]);
  const [type, setType] = useState('');
  const [note, setNote] = useState('');
  const [loc, setLoc] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getReportTypes().then((t) => { setTypes(t); setType(t[0] || ''); }).catch(() => {});
  }, []);

  // Try to get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setLoc(coords);
          api.getReports(coords[0], coords[1], 5).then(setRecentReports).catch(() => {});
        },
        () => { /* Location denied — user can pick on map */ },
        { timeout: 8000 }
      );
    }
  }, []);

  function handleMapPick(lat, lng) {
    setLoc([lat, lng]);
    api.getReports(lat, lng, 5).then(setRecentReports).catch(() => {});
  }

  async function submit() {
    setMsg(''); setErr('');
    if (!loc) { setErr('Pick a spot on the map first.'); return; }
    if (!type) { setErr('Select a report type.'); return; }
    setSubmitting(true);
    try {
      await api.postReport({ lat: loc[0], lng: loc[1], type, note });
      setMsg('Report submitted! It\'s now visible on the map and feeds the safety score.');
      setNote('');
      // Refresh nearby reports
      api.getReports(loc[0], loc[1], 5).then(setRecentReports).catch(() => {});
    } catch (e) { setErr(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="full-page wide">
      <div className="page-header">
        <h2>Report an Issue</h2>
        <p>
          Flag unsafe conditions anonymously. Reports are about <strong>places and conditions</strong>, never
          individuals — a deliberate privacy boundary. Recent reports nudge the area's safety score downward,
          making the data live instead of stale.
        </p>
      </div>

      {/* Mini map for picking location */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{height: 280}}>
          <MapView
            center={loc || [20.5937, 78.9629]}
            zoom={loc ? 14 : 5}
            selected={loc}
            reports={recentReports}
            incidents={[]}
            onPick={handleMapPick}
          />
        </div>
        <div style={{padding:'12px 16px'}}>
          {loc ? (
            <p className="muted">
              <span className="material-icons-round" style={{fontSize:14, verticalAlign:'middle'}}>location_on</span>
              {' '}Reporting at {loc[0].toFixed(4)}, {loc[1].toFixed(4)} — tap the map to change
            </p>
          ) : (
            <p className="muted">
              <span className="material-icons-round" style={{fontSize:14, verticalAlign:'middle'}}>touch_app</span>
              {' '}Tap on the map to select the location you want to report
            </p>
          )}
        </div>
      </div>

      {/* Report type selection */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">category</span>
          What's the issue?
        </div>
        <div className="report-grid">
          {types.map((t) => (
            <button
              key={t}
              className={`report-type-btn ${t === type ? 'selected' : ''}`}
              onClick={() => setType(t)}
            >
              <span className="material-icons-round" style={{fontSize:18, display:'block', marginBottom:4}}>
                {REPORT_ICONS[t] || 'flag'}
              </span>
              {t.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        <label className="field-label">Add detail (optional, max 280 chars)</label>
        <textarea
          className="input"
          value={note}
          maxLength={280}
          placeholder="e.g. Street lights are out near the bus stop on MG Road"
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          className="btn btn-primary mt"
          onClick={submit}
          disabled={submitting}
        >
          <span className="material-icons-round" style={{fontSize:18}}>send</span>
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>

        {msg && <p className="success-msg mt-sm"><span className="material-icons-round" style={{fontSize:16}}>check_circle</span> {msg}</p>}
        {err && <p className="error-msg mt-sm"><span className="material-icons-round" style={{fontSize:16}}>error</span> {err}</p>}
      </div>

      {/* Recent reports nearby */}
      {recentReports.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="material-icons-round">history</span>
            Recent reports nearby
          </div>
          {recentReports.slice(0, 10).map((r) => {
            const verified = r.verified !== false;
            return (
              <div key={r.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom:'1px solid var(--border)',
                opacity: verified ? 1 : 0.55,
              }}>
                <div>
                  <span style={{fontWeight:600, fontSize:13.5, textTransform:'capitalize'}}>
                    {r.type.replace(/-/g, ' ')}
                  </span>
                  {!verified && (
                    <span style={{
                      fontSize:10, fontWeight:600, color:'#fbbf24',
                      marginLeft:6, textTransform:'uppercase', letterSpacing:'0.05em',
                    }}>unverified</span>
                  )}
                  {r.note && <p className="muted small">{r.note}</p>}
                </div>
                <span className="muted small">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
