const { db } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  try {
    const [{ data: settings, error: settingsError }, { data: products, error: productsError }] = await Promise.all([
      db().from('site_settings').select('key,value'),
      db().from('products').select('id,title,short_description,description,image_url,badge,old_price,price,stock,sort_order').eq('active', true).order('sort_order')
    ]);
    if (settingsError || productsError) throw settingsError || productsError;
    const content = Object.fromEntries((settings || []).map(row => [row.key, row.value]));
    return res.status(200).json({ settings: content, products: products || [] });
  } catch (error) {
    console.error('public api', error);
    return res.status(500).json({ error: 'load' });
  }
};
