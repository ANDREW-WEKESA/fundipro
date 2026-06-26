// db/store.js
//
// A tiny synchronous JSON-file data store standing in for Cloudflare D1.
// Every table is a plain array kept in memory and flushed to disk on write.
// The public methods (all(), get(), insert(), update(), remove()) intentionally
// mirror the shape of a SQL-ish call so that swapping this module for a real
// D1 client later only touches this file, not the route handlers.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");

const EMPTY_DB = {
  users: [],       // fundis + admin accounts
  jobs: [],         // cost-calculator entries / job history
  clients: [],       // client manager rows
  storefront_items: [], // product catalogue per fundi (a.k.a. "products")
  reviews: [],       // storefront client reviews
  payments: [],       // subscription / M-Pesa payment records
  tickets: [],        // support tickets (admin)
  materials: [],       // fundi's tools/materials inventory
  material_logs: [],    // restock / use-up history per material
  orders: [],            // customer or fundi-placed product orders
  messages: [],            // fundi <-> admin chat, plus automated reminders
  reports: [],               // metadata for generated 20-day PDF statements
};

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

let db = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export const store = {
  // Return every row in `table`, optionally filtered by a predicate.
  all(table, predicate) {
    const rows = db[table] || [];
    return predicate ? rows.filter(predicate) : [...rows];
  },

  // Return the first row matching predicate, or undefined.
  get(table, predicate) {
    return (db[table] || []).find(predicate);
  },

  // Insert a row, auto-generating id/created_at if absent. Returns the row.
  insert(table, row) {
    if (!db[table]) db[table] = [];
    const record = {
      id: row.id || nanoid(12),
      created_at: row.created_at || new Date().toISOString(),
      ...row,
    };
    db[table].push(record);
    persist();
    return record;
  },

  // Shallow-merge `patch` into the row matching predicate. Returns updated row.
  update(table, predicate, patch) {
    const rows = db[table] || [];
    const idx = rows.findIndex(predicate);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updated_at: new Date().toISOString() };
    persist();
    return rows[idx];
  },

  remove(table, predicate) {
    const rows = db[table] || [];
    const before = rows.length;
    db[table] = rows.filter((r) => !predicate(r));
    persist();
    return before - db[table].length;
  },

  // Wipe everything back to empty tables (used by seed script).
  reset() {
    db = JSON.parse(JSON.stringify(EMPTY_DB));
    persist();
  },
};
