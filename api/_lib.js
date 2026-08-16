const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let client;

function db() {
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!process.env.SUPABASE_URL || !serverKey) {
    throw new Error('Veritabanı ayarları eksik.');
  }
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function phone(value) {
  return String(value ?? '').replace(/[^0-9+]/g, '').slice(0, 16);
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(item => {
    const i = item.indexOf('=');
    return i < 0 ? ['', ''] : [item.slice(0, i).trim(), decodeURIComponent(item.slice(i + 1))];
  }).filter(([key]) => key));
}

function requireAdmin(req, res) {
  try {
    const token = parseCookies(req).kp_admin;
    if (!token || !process.env.ADMIN_JWT_SECRET) throw new Error('auth');
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
}

function adminCookie(token, maxAge = 43200) {
  return `kp_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = { db, text, phone, requireAdmin, adminCookie, safeEqual, jwt, crypto };
