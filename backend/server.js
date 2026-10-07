// server.js
import { createApp } from './src/app.js';
import { config } from './src/config.js';
import { repository } from './src/store/jsonStore.js';
import { sendSms } from './src/services/smsService.js';

const app = createApp();
const checkins = repository('checkins');

// Background worker: every 30 seconds check for newly-overdue trips and send
// one SMS alert per trip (alertSent flag prevents re-sending).
setInterval(async () => {
  try {
    const active = await checkins.find((t) => t.status === 'active' && !t.alertSent);
    const now = Date.now();
    for (const trip of active) {
      if (now <= new Date(trip.etaAt).getTime()) continue; // not yet overdue

      const mapsLink =
        trip.startLat != null && trip.startLng != null
          ? `https://www.google.com/maps?q=${trip.startLat},${trip.startLng}`
          : 'location unavailable';

      const message =
        `ALERT: ${trip.label} has not checked in by their ETA. ` +
        `Last known location: ${mapsLink}. — Suraksha`;

      console.log(`[overdue-check] trip ${trip.id} (${trip.label}) is overdue — alerting ${trip.contact}`);

      try {
        await sendSms(trip.contact, message);
      } catch (smsErr) {
        console.error(`[overdue-check] SMS failed for trip ${trip.id}:`, smsErr.message);
      }

      // Mark sent regardless of SMS outcome so we don't spam on retries.
      await checkins.update(trip.id, { alertSent: true });
    }
  } catch (err) {
    console.error('[overdue-check] failed:', err.message);
  }
}, 30000);

app.listen(config.port, () => {
  console.log(`\n  Suraksha API running on http://localhost:${config.port}`);
  console.log(`  Data source: ${config.dataSource.toUpperCase()}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health\n`);
});
