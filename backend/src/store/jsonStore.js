// store/jsonStore.js
// -----------------------------------------------------------------------------
// Persistence for crowdsourced reports and trip check-ins. Deliberately a
// file-backed JSON store so the project runs with ZERO database setup — clone,
// npm install, npm start. It's wrapped behind a small repository so swapping to
// PostgreSQL + PostGIS later means rewriting only this file. (Good interview
// line: "I kept persistence behind a repository so the storage engine is an
// implementation detail.")
// -----------------------------------------------------------------------------

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function readCollection(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const txt = await fs.readFile(file, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // first run: empty collection
    throw err;
  }
}

async function writeCollection(name, items) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(items, null, 2), 'utf8');
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Generic repository over a named JSON collection. */
export function repository(name) {
  return {
    async all() {
      return readCollection(name);
    },
    async find(predicate) {
      return (await readCollection(name)).filter(predicate);
    },
    async getById(id) {
      return (await readCollection(name)).find((x) => x.id === id) || null;
    },
    async insert(doc) {
      const items = await readCollection(name);
      const record = { id: makeId(), createdAt: new Date().toISOString(), ...doc };
      items.push(record);
      await writeCollection(name, items);
      return record;
    },
    async update(id, patch) {
      const items = await readCollection(name);
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...patch };
      await writeCollection(name, items);
      return items[idx];
    },
  };
}
