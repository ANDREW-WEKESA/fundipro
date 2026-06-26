import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();
router.use(requireAuth);

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

// Ensures the user's monthly job counter reflects the current calendar month.
// Returns the (possibly refreshed) user row.
function syncMonthlyCounter(user) {
  const thisMonth = currentMonthKey();
  if (user.month_key !== thisMonth) {
    return store.update("users", (u) => u.id === user.id, {
      month_key: thisMonth,
      jobs_count_this_month: 0,
    });
  }
  return user;
}

// GET /api/jobs — this fundi's job history, newest first
router.get("/", (req, res) => {
  const jobs = store
    .all("jobs", (j) => j.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ jobs });
});

// POST /api/jobs — create a job (enforces the Free-tier 3/month limit)
router.post("/", (req, res) => {
  const user = syncMonthlyCounter(req.user);
  const tierConfig = TIERS[user.tier] || TIERS.free;

  if (tierConfig.jobLimitPerMonth !== null && user.jobs_count_this_month >= tierConfig.jobLimitPerMonth) {
    return res.status(402).json({
      error: `Free tier is limited to ${tierConfig.jobLimitPerMonth} jobs a month. Upgrade to Pro for unlimited jobs.`,
      code: "TIER_LIMIT_REACHED",
    });
  }

  const { title, client_name, sale_price, material_cost, labour_cost, transport_cost, extra_costs } = req.body || {};
  if (!title || sale_price == null) {
    return res.status(400).json({ error: "Job title and sale price are required." });
  }

  const sp = Number(sale_price) || 0;
  const mc = Number(material_cost) || 0;
  const lc = Number(labour_cost) || 0;
  const tc = Number(transport_cost) || 0;
  const cleanExtras = Array.isArray(extra_costs)
    ? extra_costs
        .filter((e) => e && e.label && Number(e.amount) > 0)
        .map((e) => ({ label: String(e.label).slice(0, 60), amount: Number(e.amount) }))
    : [];
  const extraTotal = cleanExtras.reduce((a, e) => a + e.amount, 0);
  const profit = sp - mc - lc - tc - extraTotal;

  const job = store.insert("jobs", {
    user_id: user.id,
    title,
    client_name: client_name || "",
    sale_price: sp,
    material_cost: mc,
    labour_cost: lc,
    transport_cost: tc,
    extra_costs: cleanExtras,
    extra_cost_total: extraTotal,
    profit,
    margin_pct: sp > 0 ? Math.round((profit / sp) * 1000) / 10 : 0,
  });

  store.update("users", (u) => u.id === user.id, { jobs_count_this_month: user.jobs_count_this_month + 1 });

  res.status(201).json({ job });
});

// DELETE /api/jobs/:id
router.delete("/:id", (req, res) => {
  const removed = store.remove("jobs", (j) => j.id === req.params.id && j.user_id === req.user.id);
  if (!removed) return res.status(404).json({ error: "Job not found." });
  res.json({ ok: true });
});

// GET /api/jobs/summary — totals for the dashboard (this month + all-time)
router.get("/summary", (req, res) => {
  const all = store.all("jobs", (j) => j.user_id === req.user.id);
  const thisMonth = currentMonthKey();
  const monthJobs = all.filter((j) => j.created_at.slice(0, 7) === thisMonth);

  const sum = (arr, key) => arr.reduce((acc, j) => acc + (j[key] || 0), 0);

  res.json({
    all_time: { jobs: all.length, revenue: sum(all, "sale_price"), profit: sum(all, "profit") },
    this_month: { jobs: monthJobs.length, revenue: sum(monthJobs, "sale_price"), profit: sum(monthJobs, "profit") },
  });
});

export default router;
