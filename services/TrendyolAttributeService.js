const { cfGet, getProxyPool } = require('./cfAxios');

function mapAttribute(a) {
  // Farklı şemalarla uyumlu alan eşlemeleri:
  const id = Number(a.id ?? a.attributeId ?? 0);
  const name = String(a.name ?? a.attributeName ?? '');
  const required = Boolean(a.required ?? a.isRequired ?? false);
  const allowCustom = Boolean(a.allowCustom ?? a.allowCustomValue ?? a.hasCustomValue ?? false);
  const variant = Boolean(a.variant ?? a.isVariant ?? false);
  const list = Array.isArray(a.values) ? a.values
             : Array.isArray(a.attributeValues) ? a.attributeValues
             : [];
  const values = list.map(v => ({
    id: Number(v.id ?? v.valueId ?? 0),
    name: String(v.name ?? v.value ?? ''),
  }));
  return { id, name, required, allowCustom, variant, values };
}

const CANDIDATES = (categoryId) => [
  { url: `https://apigw.trendyol.com/integration/product/product-categories/${categoryId}/attributes` },
  { url: `https://api.trendyol.com/sapigw/integration/product/product-categories/${categoryId}/attributes` },
  { url: `https://api.trendyol.com/sapigw/product-categories/${categoryId}/attributes` },
  { url: `https://apigw.trendyol.com/integration/product/category-attributes`, queryKey: 'categoryId' },
  { url: `https://api.trendyol.com/sapigw/integration/product/category-attributes`, queryKey: 'categoryId' },
];

const PARAM_VARIANTS = (categoryId, supplierId) => [
  { includeValues: true, supplierId },
  { includeValues: true, supplierId: String(supplierId) },
  { includeValues: true, 'supplier-id': supplierId },
  { includeValues: true, 'x-supplier-id': supplierId },
  { includeValues: true, supplierId, categoryId },
  { includeValues: true, supplierId, categoryId: String(categoryId) },
];

async function fetchCategoryAttributes({ apiKey, apiSecret, categoryId, supplierId }) {
  if (!categoryId) throw new Error('categoryId zorunludur');
  const sid = Number(supplierId || 0);
  const headers = {
    Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    Accept: 'application/json',
    'User-Agent': `Woontegra/1.0 (${process.env.COMPANY_NAME || 'MercanDanismanlik'})`,
    supplierId: sid ? String(sid) : undefined,
    'Supplier-Id': sid ? String(sid) : undefined,
    'x-supplier-id': sid ? String(sid) : undefined,
  };
  const candidates = [];
  for (const c of CANDIDATES(Number(categoryId))) {
    const paramSets = PARAM_VARIANTS(Number(categoryId), sid);
    for (const params of paramSets) {
      candidates.push({
        url: c.url,
        params: c.queryKey ? { ...params, [c.queryKey]: Number(categoryId) } : params,
      });
    }
  }
  const { res, tried } = await cfGet(
    candidates,
    headers,
    getProxyPool(),
    Number(process.env.CF_MAX_RETRIES || 2),
    Number(process.env.CF_BACKOFF_MS || 1200)
  );
  const data = res.data;
  
  // Debug: Response format'ını logla
  console.log('🔍 Trendyol API Response Debug:');
  console.log('Status:', res.status);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('Data type:', typeof data);
  console.log('Data keys:', data ? Object.keys(data) : 'null');
  console.log('Data preview:', JSON.stringify(data, null, 2).substring(0, 500));
  
  const raw = Array.isArray(data) ? data
            : Array.isArray(data?.attributes) ? data.attributes
            : Array.isArray(data?.result) ? data.result
            : Array.isArray(data?.categoryAttributes) ? data.categoryAttributes
            : [];
  if (!raw.length) {
    const err = new Error('Kategori attribute\'ları boş döndü');
    err.details = tried;
    err.debug = {
      status: res.status,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'null',
      dataPreview: JSON.stringify(data, null, 2).substring(0, 500)
    };
    throw err;
  }
  const out = raw.map(mapAttribute);
  out.__debugTried = tried; // istersen kaldır
  return out;
}

module.exports = { fetchCategoryAttributes };
