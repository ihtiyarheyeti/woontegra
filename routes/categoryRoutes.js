// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// Model Tanımı
const CategoryMapping = sequelize.define("CategoryMapping", {
  woo_category_id: { type: DataTypes.STRING, allowNull: false },
  trendyol_category_id: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "category_mappings",
  timestamps: true
});

// Trendyol API Ayarları
const TRENDYOL_SUPPLIER_ID = process.env.TRENDYOL_SUPPLIER_ID;
const TRENDYOL_APP_KEY = process.env.TRENDYOL_APP_KEY;
const TRENDYOL_APP_SECRET = process.env.TRENDYOL_APP_SECRET;

// Trendyol'dan Kategori Çekme (Caching'li)
let categoryCache = null;
let cacheTime = null;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 saat

async function fetchTrendyolCategories() {
  if (categoryCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION_MS)) {
    return categoryCache; // Cache kullan
  }
  try {
    const response = await axios.get(`https://api.trendyol.com/sapigw/product-categories`, {
      headers: {
        "User-Agent": "Woontegra",
        "Authorization": "Basic " + Buffer.from(`${TRENDYOL_APP_KEY}:${TRENDYOL_APP_SECRET}`).toString("base64"),
        "Accept": "application/json"
      },
      timeout: 10000
    });
    categoryCache = response.data;
    cacheTime = Date.now();
    return categoryCache;
  } catch (err) {
    console.error("Trendyol kategori çekme hatası:", err.message);
    throw new Error("Kategori listesi alınamadı");
  }
}

// Endpointler
router.get("/categories/trendyol", async (req, res) => {
  try {
    const categories = await fetchTrendyolCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/category-mapping", async (req, res) => {
  const { woo_category_id, trendyol_category_id } = req.body;
  if (!woo_category_id || !trendyol_category_id) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }
  try {
    await CategoryMapping.upsert({ woo_category_id, trendyol_category_id });
    res.json({ success: true, message: "Kategori eşleştirme kaydedildi" });
  } catch (err) {
    console.error("Kategori eşleştirme kaydetme hatası:", err.message);
    res.status(500).json({ success: false, message: "Kayıt sırasında hata oluştu" });
  }
});

router.get("/category-mappings", async (req, res) => {
  try {
    const mappings = await CategoryMapping.findAll();
    res.json({ success: true, data: mappings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Eşleştirmeler alınamadı" });
  }
});

module.exports = router;
