const { db, requireAdmin } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  if (!requireAdmin(req, res)) return;
  try {
    const now = Date.now();
    const liveSince = new Date(now - 2 * 60 * 1000).toISOString();
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const [settingsResult, productsResult, ordersResult, liveResult, todayResult] = await Promise.all([
      db().from('site_settings').select('key,value'),
      db().from('products').select('*').order('sort_order'),
      db().from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      db().from('live_sessions').select('stage').gte('last_seen', liveSince),
      db().from('live_sessions').select('session_id', { count: 'exact', head: true }).gte('first_seen', day.toISOString())
    ]);
    const failed = [settingsResult, productsResult, ordersResult, liveResult, todayResult].find(item => item.error);
    if (failed) throw failed.error;
    const settings = Object.fromEntries((settingsResult.data || []).map(row => [row.key, row.value]));
    const liveByStage = {};
    for (const row of liveResult.data || []) liveByStage[row.stage] = (liveByStage[row.stage] || 0) + 1;
    return res.status(200).json({
      settings,
      products: productsResult.data || [],
      orders: ordersResult.data || [],
      analytics: { liveTotal: (liveResult.data || []).length, liveByStage, todayTotal: todayResult.count || 0 }
    });
  } catch (error) {
    console.error('dashboard api', error);
    return res.status(500).json({ error: 'load' });
  }
};
