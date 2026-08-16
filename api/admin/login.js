const { text, safeEqual, jwt, adminCookie } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const username = text(req.body?.username, 80);
  const password = text(req.body?.password, 200);
  const valid = process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD &&
    safeEqual(username, process.env.ADMIN_USERNAME) && safeEqual(password, process.env.ADMIN_PASSWORD);
  if (!valid || !process.env.ADMIN_JWT_SECRET) {
    await new Promise(resolve => setTimeout(resolve, 350));
    return res.status(401).json({ error: 'invalid_login' });
  }
  const token = jwt.sign({ sub: username, role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '12h' });
  res.setHeader('Set-Cookie', adminCookie(token));
  return res.status(200).json({ ok: true });
};
