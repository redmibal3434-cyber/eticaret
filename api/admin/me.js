const { requireAdmin } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  return res.status(200).json({ ok: true, username: admin.sub });
};
