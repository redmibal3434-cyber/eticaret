const { db, text } = require('./_lib');

const stages = new Set(['homepage', 'product', 'cart', 'address', 'campaign', 'processing', 'result']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const sessionId = text(req.body?.sessionId, 64);
    const stage = text(req.body?.stage, 20);
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(sessionId) || !stages.has(stage)) {
      return res.status(400).json({ error: 'validation' });
    }
    const { error } = await db().from('live_sessions').upsert({
      session_id: sessionId,
      stage,
      last_seen: new Date().toISOString()
    }, { onConflict: 'session_id' });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('track api', error);
    return res.status(500).json({ error: 'save' });
  }
};
