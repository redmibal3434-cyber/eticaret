const { db, requireAdmin, text } = require('../_lib');

const allowed = new Set([
  'site_name', 'announcement', 'logo_url', 'hero_badge', 'hero_title', 'hero_text', 'banner_url',
  'theme_primary', 'trust_1', 'trust_2', 'trust_3', 'footer_title', 'footer_text', 'footer_logo_url',
  'footer_image_1', 'footer_image_2', 'footer_image_3', 'contact_phone', 'contact_email'
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const settings = req.body?.settings || {};
    const rows = Object.entries(settings)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => ({ key, value: text(value, 1200), updated_at: new Date().toISOString() }));
    if (!rows.length) return res.status(400).json({ error: 'validation' });
    const { error } = await db().from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('settings api', error);
    return res.status(500).json({ error: 'save' });
  }
};
