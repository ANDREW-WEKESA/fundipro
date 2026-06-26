import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import jobsRoutes from "./routes/jobs.js";
import clientsRoutes from "./routes/clients.js";
import storefrontRoutes from "./routes/storefront.js";
import paymentsRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import materialsRoutes from "./routes/materials.js";
import ordersRoutes from "./routes/orders.js";
import messagesRoutes from "./routes/messages.js";
import reportsRoutes from "./routes/reports.js";
import { SUPPORT_WHATSAPP, SUPPORT_EMAIL, REPORT_INTERVAL_DAYS } from "./config.js";

dotenv.config();

const app = express();
app.use(cors());
// Higher limit than Express's 100kb default — product photos travel as base64
// data URLs in this JSON-store demo (see routes/storefront.js for the real-world note).
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "FundiPro API" }));

// Public, static platform info — single source of truth for contact details
// shown in the Settings / Support pages on the frontend.
app.get("/api/config", (req, res) => {
  res.json({ support_whatsapp: SUPPORT_WHATSAPP, support_email: SUPPORT_EMAIL, report_interval_days: REPORT_INTERVAL_DAYS });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/storefront", storefrontRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/reports", reportsRoutes);

// Centralized error fallback so a thrown error never leaks a stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`FundiPro API running on http://localhost:${PORT}`);

  // Auto-seed on first boot if the database is empty (safe to run on Render free tier)
  try {
    const { store } = await import("./db/store.js");
    const users = store.all("users");
    if (users.length === 0) {
      console.log("Database is empty — running seed...");
      const { default: seed } = await import("./db/seed.js");
      console.log("Seed complete.");
    } else {
      console.log(`Database ready — ${users.length} users found.`);
    }
  } catch (e) {
    console.error("Auto-seed error:", e.message);
  }
});

// One-time seed endpoint — call this once to populate the live database
// Protected by a secret so random people can't reset your data
app.post("/api/admin/seed", async (req, res) => {
  const { secret } = req.body || {};
  if (secret !== (process.env.SEED_SECRET || "fundipro-seed-2026")) {
    return res.status(403).json({ error: "Wrong secret." });
  }
  try {
    const { store } = await import("./db/store.js");
    store.reset();
    await import("./db/seed.js");
    res.json({ ok: true, message: "Database seeded successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
