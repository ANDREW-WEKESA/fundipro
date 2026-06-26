import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function withFlags(material) {
  const low = material.quantity <= material.low_stock_threshold;
  return { ...material, low_stock: low };
}

// GET /api/materials — this fundi's tools/materials store
router.get("/", (req, res) => {
  const materials = store
    .all("materials", (m) => m.user_id === req.user.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(withFlags);
  const lowStockCount = materials.filter((m) => m.low_stock).length;
  res.json({ materials, low_stock_count: lowStockCount });
});

// POST /api/materials — add a new material/tool to track
router.post("/", (req, res) => {
  const { name, quantity, unit, low_stock_threshold } = req.body || {};
  if (!name) return res.status(400).json({ error: "Material name is required." });

  const material = store.insert("materials", {
    user_id: req.user.id,
    name,
    quantity: Number(quantity) || 0,
    unit: unit || "pcs",
    low_stock_threshold: Number(low_stock_threshold) || 5,
  });
  res.status(201).json({ material: withFlags(material) });
});

// PATCH /api/materials/:id/restock — add stock (delivery, new purchase)
router.patch("/:id/restock", (req, res) => {
  const material = store.get("materials", (m) => m.id === req.params.id && m.user_id === req.user.id);
  if (!material) return res.status(404).json({ error: "Material not found." });

  const amount = Math.abs(Number(req.body?.amount) || 0);
  if (!amount) return res.status(400).json({ error: "Enter an amount to add." });

  const updated = store.update("materials", (m) => m.id === material.id, { quantity: material.quantity + amount });
  store.insert("material_logs", { user_id: req.user.id, material_id: material.id, change: amount, reason: req.body?.reason || "Restock" });

  res.json({ material: withFlags(updated) });
});

// PATCH /api/materials/:id/use — take stock out for a job; flags low stock in the response
router.patch("/:id/use", (req, res) => {
  const material = store.get("materials", (m) => m.id === req.params.id && m.user_id === req.user.id);
  if (!material) return res.status(404).json({ error: "Material not found." });

  const amount = Math.abs(Number(req.body?.amount) || 0);
  if (!amount) return res.status(400).json({ error: "Enter an amount to take out." });
  if (amount > material.quantity) {
    return res.status(400).json({ error: `Only ${material.quantity} ${material.unit} of ${material.name} left in stock.` });
  }

  const newQty = material.quantity - amount;
  const updated = store.update("materials", (m) => m.id === material.id, { quantity: newQty });
  store.insert("material_logs", { user_id: req.user.id, material_id: material.id, change: -amount, reason: req.body?.reason || "Used on a job" });

  const result = withFlags(updated);
  res.json({
    material: result,
    notify: result.low_stock
      ? `${material.name} is running low — only ${newQty} ${material.unit} left. Time to restock.`
      : null,
  });
});

// DELETE /api/materials/:id
router.delete("/:id", (req, res) => {
  const removed = store.remove("materials", (m) => m.id === req.params.id && m.user_id === req.user.id);
  if (!removed) return res.status(404).json({ error: "Material not found." });
  res.json({ ok: true });
});

// GET /api/materials/:id/logs — restock/use history for one material
router.get("/:id/logs", (req, res) => {
  const logs = store
    .all("material_logs", (l) => l.material_id === req.params.id && l.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ logs });
});

export default router;
