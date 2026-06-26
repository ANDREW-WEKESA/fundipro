import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/fundis — every fundi on the platform with quick stats
router.get("/fundis", (req, res) => {
  const fundis = store.all("users", (u) => u.role === "fundi").map((u) => {
    const jobs = store.all("jobs", (j) => j.user_id === u.id);
    const { password_hash, ...safe } = u;
    return {
      ...safe,
      job_count: jobs.length,
      total_revenue: jobs.reduce((a, j) => a + j.sale_price, 0),
    };
  });
  res.json({ fundis });
});

// GET /api/admin/stats — platform growth & revenue analytics
router.get("/stats", (req, res) => {
  const fundis = store.all("users", (u) => u.role === "fundi");
  const byTier = { free: 0, pro: 0, business: 0 };
  for (const f of fundis) byTier[f.tier] = (byTier[f.tier] || 0) + 1;

  const mrr = fundis.reduce((acc, f) => acc + (TIERS[f.tier]?.price || 0), 0);

  const byTrade = {};
  for (const f of fundis) byTrade[f.trade] = (byTrade[f.trade] || 0) + 1;

  const byLocation = {};
  for (const f of fundis) byLocation[f.location] = (byLocation[f.location] || 0) + 1;

  const successfulPayments = store.all("payments", (p) => p.status === "success");
  const totalCollected = successfulPayments.reduce((a, p) => a + p.amount, 0);

  const openTickets = store.all("tickets", (t) => t.status === "open").length;

  res.json({
    total_fundis: fundis.length,
    by_tier: byTier,
    mrr,
    total_collected: totalCollected,
    by_trade: byTrade,
    by_location: byLocation,
    open_tickets: openTickets,
  });
});

// GET /api/admin/tickets
router.get("/tickets", (req, res) => {
  const tickets = store
    .all("tickets")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ tickets });
});

// PATCH /api/admin/tickets/:id — resolve / update a support ticket
router.patch("/tickets/:id", (req, res) => {
  const { status } = req.body || {};
  const ticket = store.update("tickets", (t) => t.id === req.params.id, { status });
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  res.json({ ticket });
});

// GET /api/admin/orders — all orders across the platform (Andrew sees everything)
router.get("/orders", (req, res) => {
  const orders = store.all("orders").sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ orders });
});

// PATCH /api/admin/fundis/:id/status — suspend or reactivate a fundi (e.g. during a dispute)
router.patch("/fundis/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
  }
  const user = store.update("users", (u) => u.id === req.params.id && u.role === "fundi", { status });
  if (!user) return res.status(404).json({ error: "Fundi not found." });
  const { password_hash, ...safe } = user;
  res.json({ fundi: safe });
});

export default router;
