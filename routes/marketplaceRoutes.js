// routes/marketplaceRoutes.js  (DROP-IN)
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// ---- Model ----
const MarketplaceConnection = sequelize.define("MarketplaceConnection", {
  marketplace: { type: DataTypes.STRING, allowNull: false }, // "trendyol"
  supplier_id: { type: DataTypes.STRING, allowNull: true },
  app_key:     { type: DataTypes.STRING, allowNull: true },
  app_secret:  { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: "marketplace_connections",
  timestamps: true,
  indexes: [{ unique: true, fields: ["marketplace"] }]
});

// ---- Helpers ----
function pick(valA, valB, valC) {
  return valA ?? valB ?? valC ?? undefined;
}

// ---- POST /api/marketplaces/save-connection ----
// Frontend hangi isimle gönderirse göndersin (camelCase/snake_case) kabul ediyoruz.
router.post("/marketplaces/save-connection", async (req, res) => {
  try {
    const body = req.body || {};
    const marketplace = (body.marketplace || "").toString().toLowerCase();
    
    // Frontend connectionData wrapper'ını destekle
    const connectionData = body.connectionData || {};
    const data = { ...body, ...connectionData };

    // Alias desteği
    const supplier_id = pick(data.supplier_id, data.supplierId);
    const app_key     = pick(data.app_key, data.appKey, data.apiKey);
    const app_secret  = pick(data.app_secret, data.appSecret, data.apiSecret);

    if (!marketplace) {
      return res.status(400).json({ success: false, message: "marketplace zorunludur" });
    }
    if (marketplace === "trendyol" && (!supplier_id || !app_key || !app_secret)) {
      return res.status(400).json({
        success: false,
        message: "Eksik alanlar",
        missing: {
          supplier_id: !supplier_id,
          app_key:     !app_key,
          app_secret:  !app_secret
        }
      });
    }

    await MarketplaceConnection.sync(); // garanti olsun

    await MarketplaceConnection.upsert({
      marketplace,
      supplier_id,
      app_key,
      app_secret
    });

    return res.json({ success: true, message: "Bağlantı kaydedildi" });
  } catch (e) {
    console.error("save-connection hata:", e?.message);
    return res.status(500).json({ success: false, message: "Kaydetme sırasında hata" });
  }
});

// ---- GET /api/marketplaces/connection?marketplace=trendyol ----
router.get("/marketplaces/connection", async (req, res) => {
  try {
    const marketplace = (req.query.marketplace || "").toString().toLowerCase();
    if (!marketplace) {
      return res.status(400).json({ success: false, message: "marketplace zorunludur" });
    }
    await MarketplaceConnection.sync();
    const row = await MarketplaceConnection.findOne({ where: { marketplace } });
    if (!row) return res.json({ success: true, data: null });

    // app_key/app_secret maskelenmiş dön
    const masked = (s) => (s ? s.slice(0, 3) + "***" + s.slice(-2) : null);
    return res.json({
      success: true,
      data: {
        marketplace: row.marketplace,
        supplier_id: row.supplier_id,
        app_key: masked(row.app_key),
        app_secret: masked(row.app_secret),
        updated_at: row.updatedAt
      }
    });
  } catch (e) {
    console.error("get-connection hata:", e?.message);
    return res.status(500).json({ success: false, message: "Sorgu sırasında hata" });
  }
});

module.exports = router;
