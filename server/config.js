// config.js — single source of truth for the pricing model and platform constants.
// Mirrors the "Redesigned Model" doc: flat tiers, no commission (for now).

export const TIERS = {
  free: {
    label: "Free",
    price: 0,
    jobLimitPerMonth: 3,
    storefrontPublic: false, // can build it, but it's not publicly verified
    clientManagement: false,
    smsReminders: false,
  },
  pro: {
    label: "Pro",
    price: 500,
    jobLimitPerMonth: null, // unlimited
    storefrontPublic: true,
    clientManagement: false,
    smsReminders: false,
  },
  business: {
    label: "Business",
    price: 1200,
    jobLimitPerMonth: null,
    storefrontPublic: true,
    clientManagement: true,
    smsReminders: true,
  },
};

export const GRACE_PERIOD_DAYS = 7;       // full access after a missed payment
export const DOWNGRADE_AFTER_DAYS = 8;     // degrade to Free if still unpaid

export const JWT_SECRET = process.env.JWT_SECRET || "fundipro-dev-secret-change-me";
export const JWT_EXPIRES_IN = "30d";

// --- Platform contact / ownership details ---
export const ADMIN_PHONE = "0710435113";          // Andrew's own login
export const SUPPORT_WHATSAPP = "0107875549";      // fundis tap "Support" to reach Andrew directly
export const SUPPORT_EMAIL = "andrewwekesa675@gmail.com";

// --- Reports ---
export const REPORT_INTERVAL_DAYS = 20; // how often a statement is "due"

// --- Phase 2 (NOT active yet) ---
// Referral commission: if Andrew personally brings a fundi a client, FundiPro
// takes a small cut of that one sale's profit. Deliberately unused right now —
// wire this into routes/orders.js (on order completion) when it's time to turn it on.
export const REFERRAL_COMMISSION_RATE = 0.02; // 2%, future use only
