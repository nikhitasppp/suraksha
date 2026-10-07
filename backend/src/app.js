// src/app.js
// Wires the Express application together. Kept separate from server.js so the
// app can be imported in tests without binding a port.

import express from 'express';
import cors from 'cors';

import safetyRoutes from './routes/safety.js';
import reportRoutes from './routes/reports.js';
import checkinRoutes from './routes/checkins.js';
import helplineRoutes from './routes/helplines.js';

export function createApp() {
  const app = express();

  app.use(cors()); // dev convenience; lock to your frontend origin in production
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'suraksha-api' }));

  app.use('/api/safety', safetyRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/checkins', checkinRoutes);
  app.use('/api', helplineRoutes); // exposes /api/helplines and /api/police-stations

  // Fallback 404 for unknown API routes.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'unknown endpoint' }));

  return app;
}
