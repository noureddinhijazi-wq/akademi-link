const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(collection) {
  ensureDir();
  const file = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return []; }
}

function write(collection, data) {
  ensureDir();
  const file = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nextId(collection) {
  const items = read(collection);
  if (!items.length) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

const db = {
  // Generic CRUD
  findAll: (col, filter = {}) => {
    let items = read(col);
    Object.keys(filter).forEach(k => {
      items = items.filter(i => i[k] == filter[k]);
    });
    return items;
  },
  findOne: (col, filter = {}) => {
    const items = db.findAll(col, filter);
    return items[0] || null;
  },
  findById: (col, id) => db.findOne(col, { id: Number(id) }),
  insert: (col, data) => {
    const items = read(col);
    const newItem = { id: nextId(col), createdAt: new Date().toISOString(), ...data };
    items.push(newItem);
    write(col, items);
    return newItem;
  },
  update: (col, id, data) => {
    const items = read(col);
    const idx = items.findIndex(i => i.id == id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    write(col, items);
    return items[idx];
  },
  delete: (col, id) => {
    const items = read(col);
    const filtered = items.filter(i => i.id != id);
    write(col, filtered);
    return filtered.length < items.length;
  }
};

module.exports = db;
