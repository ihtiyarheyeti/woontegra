const express = require('express');
const router = express.Router();
const trendyolController = require('../controllers/trendyolController');
const { authenticateToken } = require('../middleware/auth');
const { getFlatCategories, buildTree, getChildren, getPath } = require('../services/TrendyolCategoryService');
const { fetchCategoryAttributes } = require('../services/TrendyolAttributeService');
const { sequelize } = require('../config/database');

// Mağaza bilgilerini DB'den oku
async function readStoreAuth(storeId, db = sequelize) {
  // 1) DB'den mağaza anahtarlarını dene
  try {
    const [rows] = await db.query(
      'SELECT api_key, api_secret, supplier_id FROM stores WHERE id = ? LIMIT 1',
      { replacements: [storeId] }
    );
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row?.api_key && row?.api_secret) {
      return { apiKey: row.api_key, apiSecret: row.api_secret, supplierId: row?.supplier_id, source: 'db' };
    }
  } catch (e) {
    // tablo yok/isim farklı ise sessiz geç ve .env fallback'e düş
  }
  // 2) .env fallback
  if (process.env.TRENDYOL_API_KEY && process.env.TRENDYOL_API_SECRET) {
    return {
      apiKey: process.env.TRENDYOL_API_KEY,
      apiSecret: process.env.TRENDYOL_API_SECRET,
      supplierId: process.env.TRENDYOL_SUPPLIER_ID || 0,
      source: 'env'
    };
  }
  throw new Error('Trendyol API anahtarları bulunamadı (DB/env)');
}

// ---------- ÖNCE CHILDREN & PATH TANIMLARI (parametreli route'lar varsa çatışmasın) ----------
// GET /api/trendyol/categories/children?storeId=1&parentId=0
router.get('/categories/children', async (req, res) => {
  const started = Date.now();
  try {
    const storeId = Number(req.query.storeId || 0);
    const parentId = Number(req.query.parentId || 0);
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false });
    const items = getChildren(flat, parentId);
    return res.json({
      success: true,
      parentId,
      count: items.length,
      ms: Date.now() - started,
      categories: items,
    });
  } catch (err) {
    const code = err?.response?.status || 500;
    return res.status(code).json({
      success: false,
      error: err?.response?.data || err?.message || 'Alt kategoriler alınamadı',
      details: err?.details || err?.tried,
      cacheUsed: !!err?.cacheUsed,
      at: req.originalUrl,
      ms: Date.now() - started,
    });
  }
});

// GET /api/trendyol/categories/path?storeId=1&categoryId=12345
router.get('/categories/path', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const categoryIdRaw = req.query.categoryId;
    const categoryId = Number(categoryIdRaw);
    if (!storeId) return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({ success: false, error: 'categoryId geçersiz', categoryId: categoryIdRaw });
    }
    const { apiKey, apiSecret } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, force: false });
    const path = getPath(flat, categoryId);
    return res.json({ success: true, categoryId, path });
  } catch (err) {
    const code = err?.response?.status || 500;
    return res.status(code).json({
      success: false,
      error: err?.response?.data || err?.message || 'Kategori yolu alınamadı',
      at: req.originalUrl,
    });
  }
});

// Yeni kategori endpoint'leri - lazy loading için
// GET /api/trendyol/categories?storeId=1&format=tree&force=false
router.get('/categories', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const format = req.query.format || 'flat';
    const force = req.query.force === 'true';
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force });
    const payload = (format === 'tree')
      ? { success: true, format: 'tree', count: flat.length, tree: buildTree(flat) }
      : { success: true, format: 'flat', count: flat.length, categories: flat };
    return res.json(payload);
  } catch (err) {
    const code = err?.response?.status || 500;
    return res.status(code).json({
      success: false,
      error: err?.response?.data || err?.message || 'Kategori listesi alınamadı',
      details: err?.details || err?.tried,
      cacheUsed: !!err?.cacheUsed,
      at: req.originalUrl,
    });
  }
});

// GET /api/trendyol/category-attributes?storeId=1&categoryId=12345
router.get('/category-attributes', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const categoryId = Number(req.query.categoryId || 0);
    if (!storeId || !categoryId) {
      return res.status(400).json({ success: false, error: 'storeId ve categoryId zorunludur' });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const attributes = await fetchCategoryAttributes({ apiKey, apiSecret, categoryId, supplierId });
    const resp = { success: true, categoryId, attributes };
    if (process.env.NODE_ENV !== 'production') resp._supplierId = supplierId || 0;
    return res.json(resp);
  } catch (err) {
    console.error('category-attributes error:', err?.message, err?.details || err?.tried || '');
    return res.status(500).json({
      success: false,
      error: err?.response?.data || err?.message || 'Kategori özellikleri alınamadı',
      details: err?.details || err?.tried,
    });
  }
});

// GET /api/trendyol/diagnose
router.get('/diagnose', async (req, res) => {
  try {
    const { TRENDYOL_SUPPLIER_ID } = process.env;
    const egress = await fetch('https://api.ipify.org?format=json').then(r => r.json()).catch(() => ({ ip: null }));
    // minik bir ping: sadece header almak için küçük bir istek
    const ping = await fetch('https://apigw.trendyol.com/integration/product/ping', { method: 'GET' }).catch(() => null);
    const cfRay = ping && (ping.headers.get('cf-ray') || ping.headers.get('CF-RAY'));
    return res.json({
      success: true,
      supplierId: Number(TRENDYOL_SUPPLIER_ID || 0),
      egressIp: egress?.ip || null,
      cloudflareRay: cfRay || null,
      note: 'egressIp Trendyol\'un gördüğü IP ile aynı olmayabilir (proxy kullanıyorsanız).'
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e?.message || 'diagnose failed' });
  }
});

// Mock data route'ları
router.get('/real-categories', authenticateToken, trendyolController.getTrendyolCategories);
router.get('/supplier-addresses', authenticateToken, trendyolController.getSupplierAddresses);
router.get('/static-providers', authenticateToken, trendyolController.getStaticProviders);

// Yeni Trendyol entegrasyon route'ları
router.get('/trendyol-categories', authenticateToken, trendyolController.getTrendyolCategories);
router.get('/trendyol-brands', authenticateToken, trendyolController.getTrendyolBrands);
router.get('/trendyol-attributes', authenticateToken, trendyolController.getTrendyolAttributes);
router.post('/send-product-to-trendyol', authenticateToken, trendyolController.sendProductToTrendyol);

// Ürün durumunu kontrol et
router.get('/product-status/:productId', authenticateToken, trendyolController.checkProductStatus);

// Trendyol'dan ürünleri çek
router.get('/pull-products', authenticateToken, trendyolController.pullProducts);

// Seçilen ürünleri WooCommerce'a aktar
router.post('/import-to-woocommerce', authenticateToken, trendyolController.importToWooCommerce);

// Test authentication
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Authentication successful', user: req.user });
});

// Ürün ayarlarını kaydet
router.post('/product-settings', authenticateToken, async (req, res) => {
  try {
    const { productId, categoryId, supplierAddressId, shippingProviderId, fixedPriceIncrease, percentagePriceIncrease } = req.body;
    
    // Burada ProductSyncMap tablosuna kayıt yapılacak
    // Şimdilik mock response
    res.json({
      success: true,
      message: 'Ürün ayarları başarıyla kaydedildi',
      data: {
        productId,
        categoryId,
        supplierAddressId,
        shippingProviderId,
        fixedPriceIncrease,
        percentagePriceIncrease
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ürün ayarları kaydedilemedi: ' + error.message
    });
  }
});

module.exports = router; 
 