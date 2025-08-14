const fs = require('fs');
const path = require('path');
const { cfGet, getProxyPool } = require('../utils/cfAxios');
const TTL_MS = 1000 * 60 * 60 * 6; // 6 saat cache (bellek)
const DISK_PATH = path.join(process.cwd(), 'data', 'trendyol_categories_cache.json');
let _cache = { flat: null, fetchedAt: 0, source: '' };

// Disk cache yardımcıları
function ensureDir(p) {
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch (_) {}
}
function saveDiskCache(flat, source) {
  try {
    ensureDir(DISK_PATH);
    fs.writeFileSync(DISK_PATH, JSON.stringify({ flat, fetchedAt: Date.now(), source }, null, 2), 'utf8');
  } catch (_) {}
}
function loadDiskCache() {
  try {
    const raw = fs.readFileSync(DISK_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.flat) && data.flat.length) {
      _cache = { flat: data.flat, fetchedAt: data.fetchedAt || 0, source: data.source || 'disk' };
      return _cache.flat;
    }
  } catch (_) {}
  return null;
}

function _normalizeCat(c) {
  // parent alanı farklı isimlerle gelebilir
  const rawPid =
    c?.parentId ??
    c?.parentCategoryId ??
    (c?.parentCategory && c.parentCategory.id) ??
    0;
  const pid = rawPid == null ? 0 : Number(rawPid);
  const id = Number(c?.id ?? 0);
  const name = String(c?.name ?? '');
  return {
    id: Number.isNaN(id) ? 0 : id,
    name,
    parentId: Number.isNaN(pid) ? 0 : pid,
    leaf: Boolean(c?.leaf ?? c?.isLeaf ?? (Array.isArray(c?.subCategories) ? c.subCategories.length === 0 : false)),
  };
}

// Aday endpoint'ler (sahada görülen varyantlar)
const CANDIDATE_URLS = [
  'https://apigw.trendyol.com/integration/product/product-categories',
  'https://api.trendyol.com/sapigw/integration/product/product-categories',
  'https://api.trendyol.com/sapigw/product-categories',
];

async function fetchFlatCategoriesFromTrendyol(apiKey, apiSecret, supplierId) {
  const sid = Number(supplierId || 0);
  const headers = {
    Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    Accept: 'application/json',
    'User-Agent': `Woontegra/1.0 (${process.env.COMPANY_NAME || 'MercanDanismanlik'})`,
    // Bazı gateway'lerde header beklenebiliyor; zararsız
    supplierId: sid ? String(sid) : undefined,
    'Supplier-Id': sid ? String(sid) : undefined,
    'x-supplier-id': sid ? String(sid) : undefined,
  };
  const candidates = CANDIDATE_URLS.map(url => ({ url, params: {} }));
  const { res, tried } = await cfGet(
    candidates,
    headers,
    getProxyPool(),
    Number(process.env.CF_MAX_RETRIES || 2),
    Number(process.env.CF_BACKOFF_MS || 1200)
  );
  const data = res.data;
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.categories)) list = data.categories;
  else if (Array.isArray(data?.result)) list = data.result;
  else if (Array.isArray(data?.subCategories)) {
    const out = [];
    (function walk(nodes, parentId = 0) {
      for (const node of nodes) {
        out.push({ id: node.id, name: node.name, parentId, leaf: !node.subCategories?.length });
        if (Array.isArray(node.subCategories) && node.subCategories.length) {
          walk(node.subCategories, node.id);
        }
      }
    })(data.subCategories, 0);
    list = out;
  }
  if (!Array.isArray(list) || list.length === 0) {
    const err = new Error('Kategori listesi boş döndü');
    err.details = tried;
    throw err;
  }
  _cache.source = res.request?.res?.responseUrl || 'trendyol';
  const normalized = list.map(_normalizeCat);
  // kalıcılaştır
  saveDiskCache(normalized, _cache.source);
  return normalized;
}

async function getFlatCategories({ apiKey, apiSecret, supplierId, force = false, cacheOnly = false }) {
  const now = Date.now();
  // Bellek cache taze ise
  if (!force && Array.isArray(_cache.flat) && now - _cache.fetchedAt < TTL_MS) return _cache.flat;
  // Sadece cache isteniyorsa: önce bellek, sonra disk
  if (cacheOnly) {
    if (Array.isArray(_cache.flat) && _cache.flat.length) return _cache.flat;
    const disk = loadDiskCache();
    if (Array.isArray(disk) && disk.length) return disk;
    const e = new Error('Cache boş (cacheOnly)');
    e.cacheOnly = true;
    throw e;
  }
  try {
    const flat = await fetchFlatCategoriesFromTrendyol(apiKey, apiSecret, supplierId);
    _cache = { flat, fetchedAt: now, source: _cache.source };
    return flat;
  } catch (e) {
    // Hata varsa: önce bellek, sonra disk cache'e düş
    if (Array.isArray(_cache.flat) && _cache.flat.length) {
      e.cacheUsed = true;
      return _cache.flat;
    }
    const disk = loadDiskCache();
    if (Array.isArray(disk) && disk.length) {
      e.cacheUsed = true;
      return disk;
    }
    throw e;
  }
}

function buildTree(flat) {
  const map = new Map();
  flat.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots = [];
  for (const node of map.values()) {
    const pid = Number(node.parentId || 0);
    if (pid === 0 || !map.has(pid)) {
      roots.push(node);
    } else {
      map.get(pid).children.push(node);
    }
  }
  return roots;
}

function getChildren(flat, parentId) {
  const pid = Number(parentId || 0);
  if (!Array.isArray(flat)) return [];
  return flat.filter(c => Number(c.parentId || 0) === pid);
}

function getPath(flat, categoryId) {
  const id = Number(categoryId);
  const byId = new Map(flat.map(c => [c.id, c]));
  const path = [];
  let cur = byId.get(id);
  while (cur) {
    path.unshift(cur);
    if (!cur.parentId || Number(cur.parentId) === 0) break;
    cur = byId.get(Number(cur.parentId));
  }
  return path;
}

module.exports = {
  getFlatCategories,
  buildTree,
  getChildren,
  getPath,
  _cache, // debug amaçlı
  // Yeni yardımcılar:
  isLeaf(cat) { return Boolean(cat?.leaf); },
  findLeafDescendant(flat, categoryId) {
    const id = Number(categoryId || 0);
    const byParent = new Map();
    for (const c of flat) {
      const p = Number(c.parentId || 0);
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(c);
    }
    // BFS: en yakın leaf torunu
    const q = (byParent.get(id) || []).slice();
    while (q.length) {
      const node = q.shift();
      if (node?.leaf) return node;
      const kids = byParent.get(node?.id) || [];
      q.push(...kids);
    }
    return null; // yoksa null
  },
};
