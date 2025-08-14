// routes/marketplaceRoutes.js  (DROP-IN)
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

// ---- Model ----
const MarketplaceConnection = sequelize.define("MarketplaceConnection", {
  tenant_id:   { type: DataTypes.INTEGER, allowNull: false },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  marketplace: { type: DataTypes.STRING, allowNull: false }, // "trendyol"
  supplier_id: { type: DataTypes.STRING, allowNull: true },
  app_key:     { type: DataTypes.STRING, allowNull: true },
  app_secret:  { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: "marketplace_connections",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["tenant_id", "customer_id", "marketplace"] },
    { fields: ["tenant_id", "customer_id"] }
  ]
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
    const tenant_id = Number(body.tenant_id || body.tenantId || 1);
    const customer_id = Number(body.customer_id || body.customerId || 1);
    
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
      tenant_id,
      customer_id,
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
    const tenant_id = Number(req.query.tenant_id || req.query.tenantId || 1);
    const customer_id = Number(req.query.customer_id || req.query.customerId || 1);
    
    if (!marketplace) {
      return res.status(400).json({ success: false, message: "marketplace zorunludur" });
    }
    await MarketplaceConnection.sync();
    const row = await MarketplaceConnection.findOne({ 
      where: { tenant_id, customer_id, marketplace } 
    });
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

// ---- GET /api/marketplaces/connections ----
router.get("/marketplaces/connections", async (req, res) => {
  try {
    const tenant_id = Number(req.query.tenant_id || req.query.tenantId || 1);
    const customer_id = Number(req.query.customer_id || req.query.customerId || 1);
    
    await MarketplaceConnection.sync();
    const items = await MarketplaceConnection.findAll({ 
      where: { tenant_id, customer_id },
      order: [['updatedAt', 'DESC']]
    });
    
    // app_key/app_secret maskelenmiş dön
    const masked = (s) => (s ? s.slice(0, 3) + "***" + s.slice(-2) : null);
    const maskedItems = items.map(item => ({
      id: item.id,
      marketplace: item.marketplace,
      supplier_id: item.supplier_id,
      app_key: masked(item.app_key),
      app_secret: masked(item.app_secret),
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }));
    
    return res.json({ success: true, data: maskedItems });
  } catch (e) {
    console.error("get-connections hata:", e?.message);
    return res.status(500).json({ success: false, message: "Bağlantılar alınırken hata" });
  }
});

module.exports = router;
