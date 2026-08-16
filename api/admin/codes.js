const { db, requireAdmin, text, code } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const action = text(req.body?.action, 20);
    if (action === 'create') {
      const promo = req.body?.promo || {};
      const normalized = code(promo.code);
      const maxUses = Math.max(1, Math.trunc(Number(promo.max_uses) || 1));
      if (!/^[A-Z0-9-]{6,32}$/.test(normalized)) return res.status(400).json({ error: 'code' });
      const payload = {
        code: normalized,
        label: text(promo.label, 150),
        max_uses: maxUses,
        expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString() : null,
        active: true
      };
      const { data, error } = await db().from('promo_codes').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json({ ok: true, promo: data });
    }
    if (action === 'toggle') {
      const id = text(req.body?.id, 40);
      const { error } = await db().from('promo_codes').update({ active: Boolean(req.body?.active) }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'action' });
  } catch (error) {
    console.error('codes api', error);
    return res.status(500).json({ error: 'save' });
  }
};
