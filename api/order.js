const { db, text, phone } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const productId = text(req.body?.productId, 40);
    const customerName = text(req.body?.customerName, 120);
    const customerPhone = phone(req.body?.customerPhone);
    const customerAddress = text(req.body?.customerAddress, 600);
    const requestNo = String(req.body?.requestNo ?? '').replace(/\D/g, '').slice(0, 16);
    const socialCode = String(req.body?.socialCode ?? '').trim().toUpperCase().slice(0, 8);
    const sessionId = text(req.body?.sessionId, 64);

    if (!/^[0-9a-f-]{36}$/i.test(productId)) return res.status(400).json({ error: 'product' });
    if (customerName.length < 3) return res.status(400).json({ error: 'name' });
    if (!/^\+?[0-9]{10,15}$/.test(customerPhone)) return res.status(400).json({ error: 'phone' });
    if (customerAddress.length < 10) return res.status(400).json({ error: 'address' });
    if (!/^\d{16}$/.test(requestNo)) return res.status(400).json({ error: 'invalid_request' });
    if (!/^SK-\d{2}-\d{2}$/.test(socialCode)) return res.status(400).json({ error: 'invalid_social_code' });

    const { data, error } = await db().rpc('place_order_v1', {
      p_product_id: productId,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_address: customerAddress,
      p_request_no: requestNo,
      p_social_code: socialCode,
      p_session_id: sessionId
    });
    if (error) throw error;
    if (!data?.ok) return res.status(409).json(data || { ok: false, error: 'save' });
    return res.status(200).json(data);
  } catch (error) {
    console.error('order api', error);
    return res.status(500).json({ error: 'save' });
  }
};
