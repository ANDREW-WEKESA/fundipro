import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();
router.use(requireAuth);

// POST /api/payments/stk-push
// Simulates Safaricom's Daraja STK Push: creates a pending payment, then
// resolves it after a short delay — exactly the place a real Daraja
// callback handler would plug in instead of the setTimeout below.
router.post("/stk-push", (req, res) => {
  const { tier } = req.body || {};
  if (!TIERS[tier] || tier === "free") {
    return res.status(400).json({ error: "Choose a valid paid tier: pro or business." });
  }

  const amount = TIERS[tier].price;
  const payment = store.insert("payments", {
    user_id: req.user.id,
    tier,
    amount,
    status: "pending",
    mpesa_ref: null,
  });

  // Simulate the customer entering their M-Pesa PIN on their phone.
  // 90% of the time it succeeds, mirroring the "Payment Reality" section
  // of the redesigned model (STK pushes don't always complete).
  setTimeout(() => {
    const success = Math.random() < 0.9;
    store.update("payments", (p) => p.id === payment.id, {
      status: success ? "success" : "failed",
      mpesa_ref: success ? "MPESA" + Math.random().toString(36).slice(2, 10).toUpperCase() : null,
    });
    if (success) {
      store.update("users", (u) => u.id === req.user.id, {
        tier,
        tier_status: "active",
        tier_started_at: new Date().toISOString(),
      });
    }
  }, 3000);

  res.status(202).json({ payment, message: "STK push sent. Enter your M-Pesa PIN on your phone to confirm." });
});

// GET /api/payments/:id/status — frontend polls this while waiting
router.get("/:id/status", (req, res) => {
  const payment = store.get("payments", (p) => p.id === req.params.id && p.user_id === req.user.id);
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  res.json({ payment });
});

// GET /api/payments — this user's payment history
router.get("/", (req, res) => {
  const payments = store
    .all("payments", (p) => p.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ payments });
});

export default router;
