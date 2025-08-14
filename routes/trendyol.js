const { getFlatCategories, buildTree, getChildren, getPath, isLeaf, findLeafDescendant } = require('../services/TrendyolCategoryService');
const { fetchCategoryAttributes } = require('../services/TrendyolAttributeService');
const { readStoreAuth } = require('../controllers/marketplaceConnectionController');

// ---------- ÖNCE CHILDREN & PATH TANIMLARI (parametreli route'lar varsa çatışmasın) ----------
// GET /api/trendyol/categories/children?storeId=1&parentId=0
router.get('/categories/children', async (req, res) => {
  const started = Date.now();
  try {
    const storeId = Number(req.query.storeId || 0);
    const parentIdRaw = req.query.parentId ?? 0;
    const parentId = Number(parentIdRaw);
    const cacheOnly = String(req.query.cacheOnly || 'false') === 'true';
    if (!storeId) return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    if (Number.isNaN(parentId) || parentId < 0) {
      return res.status(400).json({ success: false, error: 'parentId geçersiz', parentId: parentIdRaw });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false, cacheOnly });
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
      cacheOnly: !!err?.cacheOnly,
      at: req.originalUrl,
      ms: Date.now() - started,
    });
  }
});

// GET /api/trendyol/categories/path?storeId=1&categoryId=12345
router.get('/categories/path', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const categoryId = Number(req.query.categoryId || 0);
    if (!storeId || !categoryId) {
      return res.status(400).json({ success: false, error: 'storeId ve categoryId zorunludur' });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false });
    const path = getPath(flat, categoryId);
    return res.json({
      success: true,
      categoryId,
      count: path.length,
      path,
    });
  } catch (err) {
    const code = err?.response?.status || 500;
    return res.status(code).json({
      success: false,
      error: err?.response?.data || err?.message || 'Kategori path alınamadı',
      details: err?.details || err?.tried,
      at: req.originalUrl,
    });
  }
});

// GET /api/trendyol/categories/ensure-leaf?storeId=1&categoryId=123
// Açıklama: categoryId leaf değilse, en yakın leaf torununu ve breadcrumb path'ini döner.
router.get('/categories/ensure-leaf', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const categoryId = Number(req.query.categoryId || 0);
    if (!storeId || !categoryId) return res.status(400).json({ success: false, error: 'storeId ve categoryId zorunludur' });
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false });
    const byId = new Map(flat.map(c => [Number(c.id), c]));
    const cur = byId.get(categoryId);
    if (!cur) return res.status(404).json({ success: false, error: 'Kategori bulunamadı' });
    const path = getPath(flat, categoryId);
    if (isLeaf(cur)) return res.json({ success: true, leaf: true, categoryId, usedCategoryId: categoryId, path });
    const leafNode = findLeafDescendant(flat, categoryId);
    if (!leafNode) return res.json({ success: true, leaf: false, usedCategoryId: null, path, note: 'Bu kategorinin altında leaf bulunamadı' });
    const leafPath = getPath(flat, leafNode.id);
    return res.json({ success: true, leaf: false, categoryId, usedCategoryId: leafNode.id, path: leafPath });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'ensure-leaf hata' });
  }
});

// GET /api/trendyol/category-attributes/smart?storeId=1&categoryId=123
// Açıklama: leaf değilse otomatik en yakın leaf'e inip attribute getirir; usedCategoryId ile döner.
router.get('/category-attributes/smart', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const categoryId = Number(req.query.categoryId || 0);
    if (!storeId || !categoryId) return res.status(400).json({ success: false, error: 'storeId ve categoryId zorunludur' });
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    // flat al ve leaf'i garanti et
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false });
    const byId = new Map(flat.map(c => [Number(c.id), c]));
    const cur = byId.get(categoryId);
    if (!cur) return res.status(404).json({ success: false, error: 'Kategori bulunamadı' });
    let usedId = categoryId;
    if (!isLeaf(cur)) {
      const leafNode = findLeafDescendant(flat, categoryId);
      if (!leafNode) return res.json({ success: true, usedCategoryId: null, attributes: [], note: 'Leaf alt bulunamadı' });
      usedId = Number(leafNode.id);
    }
    const attributes = await fetchCategoryAttributes({ apiKey, apiSecret, categoryId: usedId, supplierId });
    return res.json({ success: true, categoryId, usedCategoryId: usedId, attributes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'smart-attributes hata', details: err?.details || err?.tried });
  }
});

// GET /api/trendyol/category-attributes/scan?storeId=1&parentId=0&limit=5
// Açıklama: parent altını BFS ile gezip attribute'u DOLU olan ilk leaf kategorilerden örnekler döner (teşhis amaçlı).
router.get('/category-attributes/scan', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const parentId = Number(req.query.parentId || 0);
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
    const visitCap = Math.max(limit * 15, 60); // güvenli sınır
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: false });
    // BFS
    const byParent = new Map();
    for (const c of flat) {
      const p = Number(c.parentId || 0);
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(c);
    }
    const q = (byParent.get(parentId) || []).slice();
    const found = [];
    let visited = 0;
    while (q.length && found.length < limit && visited < visitCap) {
      const node = q.shift(); visited++;
      if (node?.leaf) {
        try {
          const attrs = await fetchCategoryAttributes({ apiKey, apiSecret, categoryId: node.id, supplierId });
          if (Array.isArray(attrs) && attrs.length) {
            found.push({ categoryId: node.id, name: node.name, count: attrs.length, path: getPath(flat, node.id).map(x => ({ id: x.id, name: x.name })) });
          }
        } catch(_) {}
      } else {
        const kids = byParent.get(node?.id) || [];
        q.push(...kids);
      }
    }
    return res.json({ success: true, parentId, examples: found, visited });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'scan hata' });
  }
});

// ---------- SONRA GENEL ROUTE'LAR ----------
// GET /api/trendyol/categories?storeId=1&format=flat|tree&force=false
router.get('/categories', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    const format = String(req.query.format || 'flat');
    const force = String(req.query.force || 'false') === 'true';
    const cacheOnly = String(req.query.cacheOnly || 'false') === 'true';
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    }
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force, cacheOnly });
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
      cacheOnly: !!err?.cacheOnly,
      at: req.originalUrl,
    });
  }
});

// GET /api/trendyol/categories/warmup?storeId=1
router.get('/categories/warmup', async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || 0);
    if (!storeId) return res.status(400).json({ success: false, error: 'storeId zorunludur' });
    const { apiKey, apiSecret, supplierId } = await readStoreAuth(storeId);
    const flat = await getFlatCategories({ apiKey, apiSecret, supplierId, force: true });
    return res.json({ success: true, count: flat.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e?.message || 'warmup hata', details: e?.details || e?.tried });
  }
});
