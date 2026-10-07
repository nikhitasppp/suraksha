import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function TripCheckin() {
  const [label, setLabel] = useState('');
  const [contact, setContact] = useState('');
  const [eta, setEta] = useState('20');
  const [trip, setTrip] = useState(null);
  const [err, setErr] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('acquiring'); // 'acquiring' | 'ok' | 'denied'
  const pollRef = useRef(null);

  // Acquire GPS on mount so it's ready when the user taps Start.
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps([pos.coords.latitude, pos.coords.longitude]);
        setGpsStatus('ok');
      },
      () => setGpsStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  // Poll for overdue status every 5 s once a trip is active.
  useEffect(() => {
    if (!trip || trip.status === 'safe') return;
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await api.getCheckin(trip.id);
        setTrip(fresh);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [trip?.id, trip?.status]);

  // Normalise phone: strip everything except digits, then drop a leading
  // country code (91 or +91) so pasting "+91 9876543210" still works.
  function normalisePhone(raw) {
    const digits = raw.replace(/\D/g, '');
    // If the user pasted a 12-digit number starting with 91, strip the prefix.
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits;
  }

  async function start() {
    setErr('');

    const phone = normalisePhone(contact);
    if (!phone) { setErr('Add a 10-digit trusted contact number so someone knows you\'re out.'); return; }
    if (phone.length !== 10) {
      setErr(`Enter exactly 10 digits (you have ${phone.length}). Paste or type without spaces or country code.`);
      return;
    }

    const etaNum = parseInt(eta, 10);
    if (!etaNum || etaNum <= 0) { setErr('Enter a positive number of minutes for ETA.'); return; }

    try {
      const payload = {
        label: label.trim() || 'Heading out',
        contact: phone,
        etaMinutes: etaNum,
      };
      if (gps) {
        payload.startLat = gps[0];
        payload.startLng = gps[1];
      }
      const created = await api.createCheckin(payload);
      setTrip(created);
    } catch (e) {
      setErr(e.message || 'Could not start trip — please try again.');
    }
  }

  async function markSafe() {
    try {
      const updated = await api.markSafe(trip.id);
      setTrip(updated);
    } catch (e) {
      setErr(e.message || 'Could not mark safe — please try again.');
    }
  }

  function reset() {
    setTrip(null);
    setLabel('');
    setContact('');
    setEta('20');
    setErr('');
  }

  const normalisedPhone = normalisePhone(contact);
  const phoneValid = normalisedPhone.length === 10;
  const pillClass =
    trip?.status === 'safe' ? 'pill-safe' :
    trip?.status === 'overdue' ? 'pill-overdue' : 'pill-active';

  return (
    <div className="full-page">
      <div className="page-header">
        <h2>Trip Check-in</h2>
        <p>
          Start a trip with an ETA. If you don't mark yourself safe by then,
          your trusted contact receives an automated SMS alert with your last known location.
        </p>
      </div>

      {!trip ? (
        <div className="card">
          <div className="card-title">
            <span className="material-icons-round">directions_walk</span>
            Start a new trip
          </div>

          {/* GPS status indicator */}
          {gpsStatus === 'ok' && gps && (
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', color: 'var(--green)' }}>gps_fixed</span>
              {' '}GPS ready: {gps[0].toFixed(5)}, {gps[1].toFixed(5)}
            </p>
          )}
          {gpsStatus === 'acquiring' && (
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle' }}>gps_not_fixed</span>
              {' '}Acquiring GPS location…
            </p>
          )}
          {gpsStatus === 'denied' && (
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', color: 'var(--amber)' }}>gps_off</span>
              {' '}Location access denied — starting location won't be included in alert.
            </p>
          )}

          <label className="field-label">Where are you headed?</label>
          <input
            className="input"
            value={label}
            placeholder="e.g. Walking home from college"
            onChange={(e) => setLabel(e.target.value)}
          />

          <label className="field-label">Trusted contact (10-digit mobile number)</label>
          <input
            className="input"
            value={contact}
            placeholder="e.g. 9876543210"
            inputMode="tel"
            autoComplete="tel"
            onChange={(e) => setContact(e.target.value)}
            style={{ borderColor: contact && !phoneValid ? 'var(--rose)' : undefined }}
          />
          {contact && !phoneValid && (
            <p style={{ fontSize: 12, color: 'var(--rose)', marginTop: 4 }}>
              {normalisedPhone.length < 10
                ? `${10 - normalisedPhone.length} more digit${10 - normalisedPhone.length === 1 ? '' : 's'} needed`
                : `Too long — enter 10 digits only (no +91 or spaces)`}
            </p>
          )}
          {contact && phoneValid && (
            <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✓ {normalisedPhone}</p>
          )}

          <label className="field-label">I'll check in within (minutes)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="480"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
          />

          <button className="btn btn-primary mt" onClick={start}>
            <span className="material-icons-round" style={{ fontSize: 18 }}>play_arrow</span>
            Start Trip
          </button>
          {err && <p className="error-msg mt-sm"><span className="material-icons-round" style={{ fontSize: 16 }}>error</span> {err}</p>}
        </div>
      ) : (
        <div className="card">
          <div className="card-title">
            <span className="material-icons-round">route</span>
            Active Trip
          </div>

          <div className="trip-status-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="trip-label">{trip.label}</div>
              <span className={`pill ${pillClass}`}>{trip.status}</span>
            </div>
            <div className="trip-eta">
              ETA: {new Date(trip.etaAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {trip.contact && <div className="trip-contact">Alert contact: {trip.contact}</div>}
            {trip.startLat != null && (
              <div className="trip-contact" style={{ fontSize: 11 }}>
                Start: {trip.startLat.toFixed(5)}, {trip.startLng.toFixed(5)}
              </div>
            )}
          </div>

          {trip.status === 'overdue' && (
            <div className="error-msg mt" style={{ fontSize: 14, padding: '12px', background: 'var(--rose-dim)', borderRadius: 'var(--radius-sm)' }}>
              <span className="material-icons-round" style={{ fontSize: 18 }}>notifications_active</span>
              <span>
                You're <strong>overdue</strong>. An SMS alert has been sent to{' '}
                <strong>{trip.contact}</strong> with your last known location.
              </span>
            </div>
          )}

          {trip.status === 'safe' && (
            <div className="success-msg mt" style={{ fontSize: 14, padding: '12px', background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)' }}>
              <span className="material-icons-round" style={{ fontSize: 18 }}>check_circle</span>
              <span>You've checked in safely! Stay safe out there.</span>
            </div>
          )}

          <div className="mt">
            {trip.status !== 'safe' && (
              <button className="btn btn-primary" onClick={markSafe}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>verified</span>
                I've reached safely
              </button>
            )}
            {trip.status === 'safe' && (
              <button className="btn" onClick={reset}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>add</span>
                Start another trip
              </button>
            )}
          </div>
          {err && <p className="error-msg mt-sm">{err}</p>}
        </div>
      )}

      {/* How it works */}
      <div className="card">
        <div className="card-title">
          <span className="material-icons-round">info</span>
          How it works
        </div>
        <div className="muted" style={{ lineHeight: '1.8' }}>
          <p><strong>1.</strong> Start a trip with a label, a 10-digit contact number, and an ETA.</p>
          <p><strong>2.</strong> The timer runs. Do your commute, walk, or ride.</p>
          <p><strong>3.</strong> When you arrive, tap <em>"I've reached safely"</em>.</p>
          <p><strong>4.</strong> If you don't check in by your ETA, the server automatically sends an SMS to your contact with your starting location.</p>
        </div>
      </div>
    </div>
  );
}
