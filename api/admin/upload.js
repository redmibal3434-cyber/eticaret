const { db, requireAdmin, text, crypto } = require('../_lib');

const types = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const dataUrl = text(req.body?.dataUrl, 6_000_000);
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !types[match[1]]) return res.status(400).json({ error: 'type' });
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'size' });
    const path = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${types[match[1]]}`;
    const { error } = await db().storage.from('site-assets').upload(path, buffer, { contentType: match[1], upsert: false });
    if (error) throw error;
    const { data } = db().storage.from('site-assets').getPublicUrl(path);
    return res.status(200).json({ ok: true, url: data.publicUrl });
  } catch (error) {
    console.error('upload api', error);
    return res.status(500).json({ error: 'upload' });
  }
};
