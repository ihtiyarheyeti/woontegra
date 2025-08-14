// routes/categoryRoutes.js  (DROP-IN REPLACEMENT)
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// ---- Model ----
const CategoryMapping = sequelize.define("CategoryMapping", {
  woo_category_id: { type: DataTypes.STRING, allowNull: false },
  trendyol_category_id: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "category_mappings",
  timestamps: true
});

// ---- ENV ----
const TRENDYOL_APP_KEY = process.env.TRENDYOL_APP_KEY;
const TRENDYOL_APP_SECRET = process.env.TRENDYOL_APP_SECRET;

// ---- Cache ----
let categoryCache = null;
let cacheTime = 0;
const CACHE_DURATION_MS = Number(process.env.CATEGORY_CACHE_DURATION_MS || 60 * 60 * 1000);

// ---- Helpers ----
async function fetchTrendyolCategories() {
  if (categoryCache && (Date.now() - cacheTime < CACHE_DURATION_MS)) return categoryCache;

  const resp = await axios.get("https://api.trendyol.com/sapigw/product-categories", {
    headers: {
      "User-Agent": "Woontegra",
      Authorization: "Basic " + Buffer.from(`${TRENDYOL_APP_KEY}:${TRENDYOL_APP_SECRET}`).toString("base64"),
      Accept: "application/json"
    },
    timeout: 15000
  });

  categoryCache = resp.data;
  cacheTime = Date.now();
  return categoryCache;
}

// ---- Routes ----
// NOT: Frontend iki farklı yolu kullanıyor olabilir. 404 olmaması için ikisini de destekliyoruz.
const listPaths = ["/categories/trendyol", "/trendyol/categories"];

router.get(listPaths, async (req, res) => {
  try {
    console.log("[GET]", req.originalUrl);
    const data = await fetchTrendyolCategories();
    res.json({ success: true, data });
  } catch (e) {
    console.error("Trendyol kategori hatası:", e?.response?.status, e?.message);
    res.status(500).json({ success: false, message: "Kategori listesi alınamadı" });
  }
});

router.post(["/category-mapping", "/trendyol/category-mapping"], async (req, res) => {
  const { woo_category_id, trendyol_category_id } = req.body || {};
  if (!woo_category_id || !trendyol_category_id) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }
  try {
    await CategoryMapping.upsert({ woo_category_id, trendyol_category_id });
    res.json({ success: true, message: "Kategori eşleştirme kaydedildi" });
  } catch (e) {
    console.error("Eşleştirme kayıt hatası:", e.message);
    res.status(500).json({ success: false, message: "Kayıt sırasında hata oluştu" });
  }
});

router.get(["/category-mappings", "/trendyol/category-mappings"], async (_req, res) => {
  try {
    const items = await CategoryMapping.findAll();
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Eşleştirmeler alınamadı" });
  }
});

module.exports = router;
