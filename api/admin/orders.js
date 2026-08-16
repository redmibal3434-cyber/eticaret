const { db, requireAdmin, text } = require('../_lib');

const statuses = new Set(['confirmed', 'preparing', 'shipped', 'cancelled']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const id = text(req.body?.id, 40);
    const status = text(req.body?.status, 20);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.has(status)) return res.status(400).json({ error: 'validation' });
    const { error } = await db().from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('orders api', error);
    return res.status(500).json({ error: 'save' });
  }
};
