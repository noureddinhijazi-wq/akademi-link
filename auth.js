const crypto = require('crypto');

const SECRET = 'spms-secret-key-2026-uskudar';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const incoming = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return incoming === hash;
}

function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role, exp: Date.now() + 86400000 * 7
  })).toString('base64');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const t = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = t.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64');
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken };
