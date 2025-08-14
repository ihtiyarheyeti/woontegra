// routes/categoryRoutes.js  (DROP-IN: Local->Prod proxy destekli, gerçek TRENDYOL çağrısı)
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// === Model (eşleştirme için, değişmedi) ===
const CategoryMapping = sequelize.define("CategoryMapping", {
  woo_category_id: { type: DataTypes.STRING, allowNull: false },
  trendyol_category_id: { type: DataTypes.STRING, allowNull: false }
}, { tableName: "category_mappings", timestamps: true });

// === ENV ===
const TRENDYOL_APP_KEY    = process.env.TRENDYOL_APP_KEY;
const TRENDYOL_APP_SECRET = process.env.TRENDYOL_APP_SECRET;
const CATEGORY_CACHE_MS   = Number(process.env.CATEGORY_CACHE_DURATION_MS || 60 * 60 * 1000);
const FETCH_MODE          = (process.env.TRENDYOL_FETCH_MODE || "local").toLowerCase(); // "local" | "remote"
const REMOTE_BASE         = process.env.TRENDYOL_REMOTE_BASE || ""; // örn: https://woontegra.com

// === Cache ===
let categoryCache = null;
let cacheTime = 0;

// === TRENDYOL canlı çağrı (sunucudan) ===
async function fetchTrendyolLiveDirect() {
  const resp = await axios.get("https://api.trendyol.com/sapigw/product-categories", {
    headers: {
      "User-Agent": "Woontegra",
      Authorization: "Basic " + Buffer.from(`${TRENDYOL_APP_KEY}:${TRENDYOL_APP_SECRET}`).toString("base64"),
      Accept: "application/json"
    },
    timeout: 15000
  });
  return resp.data;
}

// === REMOTE üs üzerinden al (Local -> Prod -> Trendyol) ===
async function fetchTrendyolViaRemoteBase() {
  if (!REMOTE_BASE) throw new Error("TRENDYOL_REMOTE_BASE tanımlı değil");
  const url = `${REMOTE_BASE.replace(/\/+$/,"")}/api/_internal/trendyol/categories-live`;
  const resp = await axios.get(url, { timeout: 15000 });
  if (!resp.data?.success) {
    throw new Error(`Remote base hata: ${resp.data?.message || "bilinmiyor"}`);
  }
  return resp.data.data;
}

// === Ana getirici ===
async function getCategories() {
  // Cache
  if (categoryCache && (Date.now() - cacheTime < CATEGORY_CACHE_MS)) return categoryCache;

  let data;
  if (FETCH_MODE === "remote") {
    data = await fetchTrendyolViaRemoteBase();
  } else {
    data = await fetchTrendyolLiveDirect();
  }

  categoryCache = data;
  cacheTime = Date.now();
  return data;
}

// === PUBLIC LIST endpoints: iki yolu da destekle ===
const listPaths = ["/trendyol/categories", "/categories/trendyol"];
router.get(listPaths, async (req, res) => {
  try {
    const data = await getCategories();
    res.json({ success: true, data });
  } catch (e) {
    console.error("[categories] hata:", e?.response?.status, e?.message);
    res.status(500).json({ success: false, message: e?.message || "Kategori listesi alınamadı" });
  }
});

// === INTERNAL endpoint (sadece prod IP'den Trendyol'a gider) ===
router.get("/_internal/trendyol/categories-live", async (req, res) => {
  try {
    const data = await fetchTrendyolLiveDirect();
    res.json({ success: true, data });
  } catch (e) {
    const status = e?.response?.status;
    const body = e?.response?.data;
    console.error("[internal live] hata:", status || "n/a", e?.message);
    if (body) console.error("[internal live] body:", typeof body === "string" ? body : JSON.stringify(body));
    res.status(500).json({ success: false, message: `Trendyol canlı çağrı hatası (status=${status || "n/a"})` });
  }
});

// === Mapping endpoints (değişmedi) ===
router.post("/category-mapping", async (req, res) => {
  const { woo_category_id, trendyol_category_id } = req.body || {};
  if (!woo_category_id || !trendyol_category_id) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }
  try {
    await CategoryMapping.upsert({ woo_category_id, trendyol_category_id });
    res.json({ success: true, message: "Kategori eşleştirme kaydedildi" });
  } catch (e) {
    console.error("[mapping] hata:", e.message);
    res.status(500).json({ success: false, message: "Kayıt sırasında hata" });
  }
});

router.get("/category-mappings", async (_req, res) => {
  try {
    const items = await CategoryMapping.findAll();
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Eşleştirmeler alınamadı" });
  }
});

module.exports = router;

