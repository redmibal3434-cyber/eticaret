const { db, requireAdmin, text } = require('../_lib');

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const action = text(req.body?.action, 20);
    if (action === 'save') {
      const item = req.body?.product || {};
      const payload = {
        title: text(item.title, 150),
        short_description: text(item.short_description, 300),
        description: text(item.description, 2000),
        image_url: text(item.image_url, 1000),
        badge: text(item.badge, 60),
        old_price: Math.max(0, number(item.old_price)),
        price: Math.max(0, number(item.price)),
        stock: Math.max(0, Math.trunc(number(item.stock))),
        sort_order: Math.trunc(number(item.sort_order)),
        active: item.active !== false,
        updated_at: new Date().toISOString()
      };
      if (!payload.title) return res.status(400).json({ error: 'title' });
      const query = item.id
        ? db().from('products').update(payload).eq('id', text(item.id, 40)).select().single()
        : db().from('products').insert(payload).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ ok: true, product: data });
    }
    if (action === 'archive') {
      const id = text(req.body?.id, 40);
      const { error } = await db().from('products').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'action' });
  } catch (error) {
    console.error('products api', error);
    return res.status(500).json({ error: 'save' });
  }
};
