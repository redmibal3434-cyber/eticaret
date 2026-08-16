const { adminCookie } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  res.setHeader('Set-Cookie', adminCookie('', 0));
  return res.status(200).json({ ok: true });
};
