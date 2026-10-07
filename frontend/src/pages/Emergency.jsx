import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function Emergency() {
  const [helplines, setHelplines] = useState([]);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loc, setLoc] = useState(null);
  const [shared, setShared] = useState('');
  const [locError, setLocError] = useState('');
  const msgRef = useRef(null);

  useEffect(() => {
    api.getHelplines().then(setHelplines).catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLoc(coords);
        setLoadingStations(true);
        api.getPoliceStations(coords[0], coords[1])
          .then(setStations)
          .catch(() => setStations([]))
          .finally(() => setLoadingStations(false));
      },
      () => setLocError('Location access denied — enable it to find nearby stations'),
      { timeout: 10000 }
    );
  }, []);

  function buildSosMessage(coords) {
    const mapsLink = coords
      ? `https://www.google.com/maps?q=${coords[0]},${coords[1]}`
      : 'location unavailable';
    return `🆘 SOS — I need help urgently!\nMy location: ${mapsLink}\nSent via Suraksha`;
  }

  // Clipboard with textarea fallback (works without HTTPS)
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback: select a textarea
    const ta = msgRef.current;
    if (ta) {
      ta.select();
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
    }
    return Promise.resolve();
  }

  async function handleCopy() {
    const msg = buildSosMessage(loc);
    try {
      await copyToClipboard(msg);
      setShared('Message copied — paste it into any chat or message app now.');
    } catch {
      setShared('Select the text below and copy it manually.');
    }
  }

  function fetchStationsManually() {
    if (!loc) return;
    setLoadingStations(true);
    api.getPoliceStations(loc[0], loc[1])
      .then(setStations)
      .catch(() => setStations([]))
      .finally(() => setLoadingStations(false));
  }

  const sosMessage = buildSosMessage(loc);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(sosMessage)}`;
  // sms: URI — no leading & before body parameter
  const smsUrl = `sms:?body=${encodeURIComponent(sosMessage)}`;
  const googleMapsSearchUrl = loc
    ? `https://www.google.com/maps/search/police+station+near+me/@${loc[0]},${loc[1]},14z`
    : 'https://www.google.com/maps/search/police+station+near+me';

  return (
    <div className="full-page">
      <div className="page-header">
        <h2>Emergency</h2>
        <p>SOS alerts, verified helplines, and the nearest police stations to you.</p>
      </div>

      {/* SOS */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">warning</span>
          Send SOS Alert
        </div>
        <p className="muted mb">
          Send your GPS location to someone who can help.
          {loc && (
            <span> Location: <strong>{loc[0].toFixed(5)}, {loc[1].toFixed(5)}</strong></span>
          )}
          {!loc && !locError && <span> Acquiring GPS…</span>}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* WhatsApp — <a> tag avoids popup-blocker issues */}
          <a
            className="btn btn-sos"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
            onClick={() => setShared('WhatsApp opened — send the pre-filled message to your contacts.')}
          >
            <span className="material-icons-round">chat</span>
            Share via WhatsApp
          </a>

          {/* SMS — <a> tag lets the browser/OS handle the sms: scheme natively */}
          <a
            className="btn btn-sos"
            href={smsUrl}
            style={{ textDecoration: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            onClick={() => setShared('SMS app should open — send the pre-filled message. (Mobile only)')}
          >
            <span className="material-icons-round">sms</span>
            Share via SMS
          </a>

          {/* Copy — works everywhere with fallback */}
          <button className="btn" onClick={handleCopy}>
            <span className="material-icons-round">content_copy</span>
            Copy message
          </button>
        </div>

        {/* Hidden textarea used as clipboard fallback on non-HTTPS contexts */}
        <textarea
          ref={msgRef}
          readOnly
          value={sosMessage}
          style={{
            position: 'absolute', left: '-9999px', top: 0,
            width: '1px', height: '1px', opacity: 0,
          }}
        />

        {shared && (
          <p className="success-msg mt-sm">
            <span className="material-icons-round" style={{ fontSize: 16 }}>check_circle</span> {shared}
          </p>
        )}
        {locError && (
          <p className="error-msg mt-sm">
            <span className="material-icons-round" style={{ fontSize: 16 }}>location_off</span> {locError}
          </p>
        )}
      </div>

      {/* Helplines */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">call</span>
          Helplines
        </div>
        <p className="muted mb">Tap any number to call directly from your phone.</p>
        {helplines.map((h) => (
          <div className="helpline-card" key={h.number}>
            <div>
              <div className="helpline-name">{h.name}</div>
              <div className="helpline-note">{h.note}</div>
            </div>
            <a className="tel-link" href={`tel:${h.number}`}>{h.number}</a>
          </div>
        ))}
      </div>

      {/* Police stations */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">local_police</span>
          Nearest Police Stations
        </div>
        {loc && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Searching within 10 km of {loc[0].toFixed(5)}, {loc[1].toFixed(5)}
          </p>
        )}
        {locError && <p className="muted">{locError}</p>}
        {loadingStations && <p className="muted">Finding stations near you…</p>}
        {!loadingStations && stations.length === 0 && loc && (
          <div>
            <p className="muted">No stations found within 10 km on OpenStreetMap.</p>
            <button className="btn btn-ghost btn-sm mt" onClick={fetchStationsManually}>
              <span className="material-icons-round" style={{ fontSize: 16 }}>refresh</span> Retry
            </button>
          </div>
        )}
        {stations.map((s, i) => (
          <div className="station-card" key={i}>
            <div>
              <div className="station-name">{s.name}</div>
              <div className="station-dist">{s.distanceKm} km away</div>
            </div>
            <div className="btn-row">
              {s.phone && (
                <a className="tel-link" href={`tel:${s.phone}`} style={{ fontSize: 14 }}>Call</a>
              )}
              <a
                className="btn btn-sm btn-ghost"
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ width: 'auto' }}
              >
                <span className="material-icons-round" style={{ fontSize: 16 }}>directions</span>
                Navigate
              </a>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13, textDecoration: 'none' }}
          >
            <span className="material-icons-round" style={{ fontSize: 16 }}>open_in_new</span>
            Open police stations near me in Google Maps
          </a>
        </div>
      </div>

      {/* Quick tips */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">tips_and_updates</span>
          Safety Tips
        </div>
        <div className="muted" style={{ lineHeight: '1.8' }}>
          <p>• Stay on well-lit, populated streets — especially after dark.</p>
          <p>• Share your live location with a trusted contact when travelling alone.</p>
          <p>• Keep emergency numbers saved: <strong>112</strong> (all services), <strong>1091</strong> (women helpline).</p>
          <p>• Trust your instincts — if something feels wrong, move to a public space and call for help.</p>
          <p>• Carry a fully charged phone and a portable charger when going out.</p>
        </div>
      </div>
    </div>
  );
}
