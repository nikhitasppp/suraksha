# Suraksha — Area Safety, SOS & Community Reporting

> Know how safe an area is before you go, then move with a safety net.

Suraksha scores the safety of any location from real crime data, shows what's
driving that score, and surrounds the user with practical safety tools: an SOS
alert, trusted-contact trip check-ins, one-tap emergency calling, nearest police
stations, and anonymous community reporting.

This was built as a full-stack portfolio project. The README is intentionally
detailed so the project is easy to understand, run, and defend.

---

## What it does

- **Area safety score (0–100)** for any point, with a fully **explainable
  breakdown** — you can see exactly which crime categories drove the number.
- **Time-of-day aware** — the same street scores lower at night.
- **Live incident map** — a density layer of nearby crimes, coloured by severity.
- **SOS** — builds a location message and shares it (Web Share API / clipboard).
- **Emergency calling** — real Indian helplines (112, 1091, 181…) as one-tap
  `tel:` links, plus the **nearest police stations** pulled live from OpenStreetMap.
- **Trip check-ins** — start a trip with an ETA; if you don't check in, it flips
  to **OVERDUE** (the moment a production app alerts your trusted contact).
- **Crowdsourced reports** — anonymously flag unsafe *conditions* (poor lighting,
  harassment, feels unsafe). Recent reports nudge the area score.

---

## Architecture at a glance

```
frontend (React + Vite + Leaflet)
        │  REST/JSON
        ▼
backend (Node + Express)
        │
        ├── datasources/         ← pluggable crime-data providers (the key idea)
        │     ├── CrimeDataSource.js     (the contract / interface)
        │     ├── UkPoliceDataSource.js  (real street-level data — the live demo)
        │     └── IndiaNcrbDataSource.js (district-level stub — documented path)
        ├── services/safetyScore.js  ← transparent, tunable scoring model
        └── store/jsonStore.js       ← file-backed repository (swap for Postgres later)

external (all free, no API key): data.police.uk · OpenStreetMap Overpass · Nominatim
```

### The one design decision to understand

Crime data in India is **annual and district-level** (NCRB), with no street-level
API. The UK publishes **street-level, geocoded** crime data for free. So the app
is coded against a `CrimeDataSource` **interface**: the live demo uses the UK
provider for real street-level granularity, and an India (NCRB) provider plugs in
behind the same interface at coarser resolution. The scoring, map, and UI never
change — only the data source does. Switch with one env var (`DATA_SOURCE`).

---

## Running it

Requires **Node.js 18+** (uses the built-in `fetch`).

### 1. Backend

```bash
cd backend
npm install
npm start          # → http://localhost:4000  (health: /api/health)
```

To use India district-level data instead of UK street-level:

```bash
DATA_SOURCE=india npm start
```

### 2. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

Open the frontend, then **tap anywhere on the map** (or use the search box / the
London·Manchester·Birmingham chips) to assess an area. With the default UK data
source, pick a UK location for real street-level results.

> If you deploy the backend elsewhere, set `VITE_API_BASE` for the frontend.

---

## How the safety score works (so you can explain it)

1. Pull incidents within `radiusKm` of the point from the active data source.
2. Weight each by **category severity** (a violent crime counts far more than a
   bike theft — see `config.js → scoring.categoryWeights`).
3. Sum into a single **risk load**.
4. Apply a **night risk boost** if the lookup is during night hours.
5. Map risk → score with smooth exponential decay:
   `score = 100 · e^(−risk / sensitivity)`, clamped to 0–100.
6. Subtract a small, capped penalty for recent **community reports** nearby.

Every weight and threshold lives in `backend/src/config.js`, so the model is
tunable in one file and there are no magic numbers buried in logic.

---

## Notable engineering details (interview fodder)

- **Interface-driven data layer** decouples scoring from data origin.
- **Repository pattern** over persistence — JSON now, Postgres/PostGIS later with
  no change to route code.
- **TTL cache** in front of the upstream crime API to respect rate limits and
  keep map panning fast.
- **Graceful degradation** + honest UI: the data-source granularity is shown to
  the user rather than hidden.
- **Privacy/ethics boundary**: reports flag *places and conditions*, never named
  individuals — deliberate, and legally defensible.

---

## Honest limitations / next steps

- **Safe-route navigation** (routing weighted by safety score) is designed-for but
  not implemented — it needs a routing engine (e.g. OSRM/Valhalla) and is the
  natural next feature.
- **Push notifications & background SMS** for SOS/overdue alerts require a mobile
  runtime (React Native) or a push service; the web demo shows the flow via Web
  Share + polling.
- The India NCRB provider is a **stub** with sample baselines — wiring in parsed
  NCRB district CSVs is the documented next step (see `IndiaNcrbDataSource.js`).

---

## Tech stack

React 18 · Vite · React-Leaflet / Leaflet · Node.js · Express · OpenStreetMap
(CARTO tiles, Overpass, Nominatim) · data.police.uk
