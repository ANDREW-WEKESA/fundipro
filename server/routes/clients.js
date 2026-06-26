import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();
router.use(requireAuth);

function requireClientManagement(req, res, next) {
  const tierConfig = TIERS[req.user.tier] || TIERS.free;
  if (!tierConfig.clientManagement) {
    return res.status(402).json({
      error: "Client management is a Business tier feature. Upgrade to unlock it.",
      code: "TIER_FEATURE_LOCKED",
    });
  }
  next();
}

router.use(requireClientManagement);

// GET /api/clients
router.get("/", (req, res) => {
  const clients = store
    .all("clients", (c) => c.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ clients });
});

// POST /api/clients
router.post("/", (req, res) => {
  const { name, phone, notes, payment_status } = req.body || {};
  if (!name) return res.status(400).json({ error: "Client name is required." });

  const client = store.insert("clients", {
    user_id: req.user.id,
    name,
    phone: phone || "",
    notes: notes || "",
    payment_status: payment_status || "pending",
  });
  res.status(201).json({ client });
});

// PATCH /api/clients/:id
router.patch("/:id", (req, res) => {
  const client = store.update(
    "clients",
    (c) => c.id === req.params.id && c.user_id === req.user.id,
    req.body || {}
  );
  if (!client) return res.status(404).json({ error: "Client not found." });
  res.json({ client });
});

// DELETE /api/clients/:id
router.delete("/:id", (req, res) => {
  const removed = store.remove("clients", (c) => c.id === req.params.id && c.user_id === req.user.id);
  if (!removed) return res.status(404).json({ error: "Client not found." });
  res.json({ ok: true });
});

export default router;
