// routes/marketplaceRoutes.js  (DROP-IN REPLACEMENT)
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const sequelize = db?.sequelize || db;
const { DataTypes } = require("sequelize");

/* --- Model --- */
const MarketplaceConnection = sequelize.define("MarketplaceConnection", {
  marketplace: { type: DataTypes.STRING, allowNull: false }, // "trendyol", "hepsiburada"...
  supplier_id: { type: DataTypes.STRING, allowNull: true },
  app_key:     { type: DataTypes.STRING, allowNull: true },
  app_secret:  { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: "marketplace_connections",
  timestamps: true,
  indexes: [{ unique: true, fields: ["marketplace"] }]
});

/* --- Utils --- */
const pick = (a,b,c) => a ?? b ?? c ?? undefined;
async function ensureSync() { await MarketplaceConnection.sync(); }

/* --- POST: kaydet/upssert --- */
router.post("/marketplaces/save-connection", async (req, res) => {
  try {
    await ensureSync();
    const b = req.body || {};
    const marketplace = (b.marketplace || "").toLowerCase();
    const supplier_id = pick(b.supplier_id, b.supplierId);
    const app_key     = pick(b.app_key, b.appKey, b.apiKey);
    const app_secret  = pick(b.app_secret, b.appSecret, b.apiSecret);

    if (!marketplace) return res.status(400).json({ success:false, message:"marketplace zorunludur" });
    if (marketplace === "trendyol" && (!supplier_id || !app_key || !app_secret)) {
      return res.status(400).json({ success:false, message:"Eksik alanlar", missing:{
        supplier_id: !supplier_id, app_key: !app_key, app_secret: !app_secret
      }});
    }

    await MarketplaceConnection.upsert({ marketplace, supplier_id, app_key, app_secret });
    res.json({ success:true, message:"Bağlantı kaydedildi" });
  } catch (e) {
    console.error("save-connection hata:", e.message);
    res.status(500).json({ success:false, message:"Kaydetme sırasında hata" });
  }
});

/* --- GET: tek bağlantı (query ?marketplace=trendyol) --- */
router.get("/marketplaces/connection", async (req, res) => {
  try {
    await ensureSync();
    const marketplace = (req.query.marketplace || "").toLowerCase();
    if (!marketplace) return res.status(400).json({ success:false, message:"marketplace zorunludur" });

    const row = await MarketplaceConnection.findOne({ where: { marketplace } });
    if (!row) return res.json({ success:true, data:null });

    const mask = s => (s ? s.slice(0,3) + "***" + s.slice(-2) : null);
    res.json({ success:true, data:{
      marketplace: row.marketplace,
      supplier_id: row.supplier_id,
      app_key: mask(row.app_key),
      app_secret: mask(row.app_secret),
      updated_at: row.updatedAt
    }});
  } catch (e) {
    console.error("get-connection hata:", e.message);
    res.status(500).json({ success:false, message:"Sorgu sırasında hata" });
  }
});

/* --- GET: tüm bağlantılar (frontend'in istediği /marketplaces/connections) --- */
router.get("/marketplaces/connections", async (_req, res) => {
  try {
    await ensureSync();
    const rows = await MarketplaceConnection.findAll({ order: [["updatedAt","DESC"]] });
    const mask = s => (s ? s.slice(0,3) + "***" + s.slice(-2) : null);
    const data = rows.map(r => ({
      marketplace: r.marketplace,
      supplier_id: r.supplier_id,
      app_key: mask(r.app_key),
      app_secret: mask(r.app_secret),
      updated_at: r.updatedAt
    }));
    res.json({ success:true, data });
  } catch (e) {
    console.error("connections list hata:", e.message);
    res.status(500).json({ success:false, message:"Listeleme sırasında hata" });
  }
});

module.exports = router;

/* Hızlı testler (backend terminali):
curl -i http://localhost:3001/api/marketplaces/connections
curl -i "http://localhost:3001/api/marketplaces/connection?marketplace=trendyol"
curl -i -X POST http://localhost:3001/api/marketplaces/save-connection \
 -H "Content-Type: application/json" \
 -d '{"marketplace":"trendyol","supplierId":"113278","apiKey":"CVn...","apiSecret":"btL..."}'
*/
