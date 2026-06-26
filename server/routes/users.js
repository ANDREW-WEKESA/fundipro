import { Router } from "express";
import bcrypt from "bcryptjs";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();
router.use(requireAuth);

// GET /api/users/me — current user + their tier config
router.get("/me", (req, res) => {
  res.json({ user: req.user, tier_config: TIERS[req.user.tier] || TIERS.free });
});

// POST /api/users/tickets — fundi raises a support ticket
router.post("/tickets", (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ error: "Subject and message are required." });

  const ticket = store.insert("tickets", {
    user_id: req.user.id,
    user_name: req.user.name,
    subject,
    message,
    status: "open",
  });
  res.status(201).json({ ticket });
});

// GET /api/users/tickets — this fundi's own tickets
router.get("/tickets", (req, res) => {
  const tickets = store
    .all("tickets", (t) => t.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ tickets });
});

// PATCH /api/users/theme — save dark/light preference
router.patch("/theme", (req, res) => {
  const { theme } = req.body || {};
  if (!["light", "dark"].includes(theme)) return res.status(400).json({ error: "Theme must be 'light' or 'dark'." });
  const user = store.update("users", (u) => u.id === req.user.id, { theme });
  const { password_hash, ...safe } = user;
  res.json({ user: safe });
});

// PATCH /api/users/password — change password
router.patch("/password", (req, res) => {
  const { current_password, new_password } = req.body || {};
  const full = store.get("users", (u) => u.id === req.user.id);
  if (!bcrypt.compareSync(current_password, full.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }
  store.update("users", (u) => u.id === req.user.id, { password_hash: bcrypt.hashSync(new_password, 10) });
  res.json({ ok: true });
});

export default router;
