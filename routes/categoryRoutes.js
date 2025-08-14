// routes/categoryRoutes.js — LOCAL DIRECT (sunucusuz)
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// (Opsiyonel) eşleştirme modeli local DB için
const CategoryMapping = sequelize.define("CategoryMapping", {
  woo_category_id: { type: DataTypes.STRING, allowNull: false },
  trendyol_category_id: { type: DataTypes.STRING, allowNull: false }
}, { tableName: "category_mappings", timestamps: true });

// ENV
const APP_KEY    = process.env.TRENDYOL_APP_KEY || "";
const APP_SECRET = process.env.TRENDYOL_APP_SECRET || "";

// Basit cache (1 saat)
const CACHE_MS = 60 * 60 * 1000;
let cached = null;
let cachedAt = 0;

// Doğrudan Trendyol çağrısı (proxy yok)
async function fetchTrendyolCategories() {
  const auth = Buffer.from(`${APP_KEY}:${APP_SECRET}`).toString("base64");
  const resp = await axios.get("https://api.trendyol.com/sapigw/product-categories", {
    headers: {
      "Authorization": `Basic ${auth}`,
      "Accept": "application/json",
      "User-Agent": "Woontegra-Local"
    },
    timeout: 20000,
    validateStatus: () => true
  });
  return resp;
}

// GET /api/trendyol/categories  (alias: /api/categories/trendyol)
router.get(["/trendyol/categories", "/categories/trendyol"], async (_req, res) => {
  try {
    if (cached && Date.now() - cachedAt < CACHE_MS) {
      return res.json({ success: true, data: cached });
    }
    const rsp = await fetchTrendyolCategories();
    if (rsp.status >= 400) {
      return res.status(rsp.status).json({ success: false, status: rsp.status, message: "Trendyol hata", body: rsp.data });
    }
    cached = rsp.data;
    cachedAt = Date.now();
    res.json({ success: true, data: rsp.data });
  } catch (e) {
    const status = e?.response?.status || 500;
    res.status(500).json({ success: false, message: e.message, statusHint: status });
  }
});

// Eşleştirme kaydet
router.post("/category-mapping", async (req, res) => {
  const { woo_category_id, trendyol_category_id } = req.body || {};
  if (!woo_category_id || !trendyol_category_id) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }
  try {
    await CategoryMapping.upsert({ woo_category_id, trendyol_category_id });
    res.json({ success: true, message: "Kaydedildi" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Kayıt sırasında hata" });
  }
});

// Eşleştirmeleri listele
router.get("/category-mappings", async (_req, res) => {
  try {
    const rows = await CategoryMapping.findAll({ order: [["updatedAt", "DESC"]] });
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: "Listeleme hatası" });
  }
});

module.exports = router;

