// routes/checkins.js
import express from 'express';
import { repository } from '../store/jsonStore.js';

const router = express.Router();
const checkins = repository('checkins');

function withStatus(trip) {
  if (!trip) return trip;
  let status = trip.status;
  if (status === 'active' && Date.now() > new Date(trip.etaAt).getTime()) {
    status = 'overdue';
  }
  return { ...trip, status };
}

// POST /api/checkins  { label, startLat, startLng, etaMinutes, contact }
router.post('/', async (req, res) => {
  const { label, startLat, startLng, etaMinutes, contact } = req.body || {};

  if (typeof etaMinutes !== 'number' || etaMinutes <= 0) {
    return res.status(400).json({ error: 'etaMinutes must be a positive number' });
  }

  // Contact must be exactly 10 digits so the SMS service can dial it.
  if (!contact || !/^\d{10}$/.test(contact)) {
    return res.status(400).json({ error: 'contact must be a 10-digit phone number (digits only)' });
  }

  const etaAt = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();
  const trip = await checkins.insert({
    label: typeof label === 'string' ? label.slice(0, 120) : 'Trip',
    startLat: typeof startLat === 'number' ? startLat : null,
    startLng: typeof startLng === 'number' ? startLng : null,
    contact,
    etaAt,
    status: 'active',
    alertSent: false,
  });
  res.status(201).json(trip);
});

// GET /api/checkins/:id
router.get('/:id', async (req, res) => {
  const trip = await checkins.getById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'not found' });
  res.json(withStatus(trip));
});

// POST /api/checkins/:id/safe
router.post('/:id/safe', async (req, res) => {
  const updated = await checkins.update(req.params.id, {
    status: 'safe',
    arrivedAt: new Date().toISOString(),
  });
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

export default router;
