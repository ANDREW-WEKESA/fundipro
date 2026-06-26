import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { TIERS } from "../config.js";

const router = Router();

const MAX_PHOTOS = 4;
const VALID_STATUSES = ["in_progress", "available", "reserved", "sold"];

function publicProfile(user) {
  const tierConfig = TIERS[user.tier] || TIERS.free;
  return {
    id: user.id,
    name: user.name,
    slug: user.slug,
    trade: user.trade,
    location: user.location,
    bio: user.bio,
    whatsapp: user.whatsapp,
    photo_url: user.photo_url,
    verified: tierConfig.storefrontPublic,
    tier: user.tier,
  };
}

function cleanPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.filter((p) => typeof p === "string" && p.length > 0).slice(0, MAX_PHOTOS);
}

// GET /api/storefront/:slug — public, no auth required
// Returns every product (so customers can see full history), each carrying its
// own status so the UI can show "not finished yet" vs. orderable vs. sold.
router.get("/:slug", (req, res) => {
  const user = store.get("users", (u) => u.slug === req.params.slug);
  if (!user) return res.status(404).json({ error: "This storefront does not exist." });

  const items = store
    .all("storefront_items", (i) => i.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const reviews = store
    .all("reviews", (r) => r.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  // record a lightweight view counter (used by the dashboard's "X people viewed you" stat)
  store.update("users", (u) => u.id === user.id, { views: (user.views || 0) + 1 });

  res.json({ profile: publicProfile(user), items, reviews, avg_rating: avgRating, view_count: (user.views || 0) + 1 });
});

// POST /api/storefront/:slug/reviews — public, anyone can leave a review
router.post("/:slug/reviews", (req, res) => {
  const user = store.get("users", (u) => u.slug === req.params.slug);
  if (!user) return res.status(404).json({ error: "This storefront does not exist." });

  const { reviewer_name, rating, comment } = req.body || {};
  const r = Number(rating);
  if (!reviewer_name || !r || r < 1 || r > 5) {
    return res.status(400).json({ error: "Reviewer name and a rating from 1-5 are required." });
  }

  const review = store.insert("reviews", {
    user_id: user.id,
    reviewer_name,
    rating: r,
    comment: comment || "",
  });
  res.status(201).json({ review });
});

// ---- authenticated routes: managing your own storefront ----

// PATCH /api/storefront/me/profile — edit bio, trade, location, whatsapp, photo
router.patch("/me/profile", requireAuth, (req, res) => {
  const allowed = ["bio", "trade", "location", "whatsapp", "photo_url", "name"];
  const patch = {};
  for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];

  const user = store.update("users", (u) => u.id === req.user.id, patch);
  const { password_hash, ...safe } = user;
  res.json({ user: safe });
});

// GET /api/storefront/me/items
router.get("/me/items", requireAuth, (req, res) => {
  const items = store
    .all("storefront_items", (i) => i.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ items });
});

// POST /api/storefront/me/items — add a catalogue item/product.
// New products start "in_progress" by default — they show up on the storefront
// immediately (per Andrew's spec) but flagged as not-yet-finished until the
// fundi marks them done, at which point they become orderable.
router.post("/me/items", requireAuth, (req, res) => {
  const { title, description, cash_price, hp_price, photos, status } = req.body || {};
  if (!title) return res.status(400).json({ error: "Item title is required." });

  const item = store.insert("storefront_items", {
    user_id: req.user.id,
    title,
    description: description || "",
    cash_price: Number(cash_price) || 0,
    hp_price: Number(hp_price) || 0,
    photos: cleanPhotos(photos),
    status: VALID_STATUSES.includes(status) ? status : "in_progress",
    completed_at: null,
  });
  res.status(201).json({ item });
});

// PATCH /api/storefront/me/items/:id — edit a product's details/photos
router.patch("/me/items/:id", requireAuth, (req, res) => {
  const allowed = ["title", "description", "cash_price", "hp_price"];
  const patch = {};
  for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];
  if (req.body?.photos !== undefined) patch.photos = cleanPhotos(req.body.photos);

  const item = store.update("storefront_items", (i) => i.id === req.params.id && i.user_id === req.user.id, patch);
  if (!item) return res.status(404).json({ error: "Product not found." });
  res.json({ item });
});

// PATCH /api/storefront/me/items/:id/status — mark in-progress/available/sold/reserved
router.patch("/me/items/:id/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });

  const patch = { status };
  if (status === "available") patch.completed_at = new Date().toISOString();

  const item = store.update("storefront_items", (i) => i.id === req.params.id && i.user_id === req.user.id, patch);
  if (!item) return res.status(404).json({ error: "Product not found." });
  res.json({ item });
});

// DELETE /api/storefront/me/items/:id
router.delete("/me/items/:id", requireAuth, (req, res) => {
  const removed = store.remove("storefront_items", (i) => i.id === req.params.id && i.user_id === req.user.id);
  if (!removed) return res.status(404).json({ error: "Item not found." });
  res.json({ ok: true });
});

// POST /api/storefront/:slug/orders — PUBLIC. A customer places an order, either
// against an in-stock product, or as a custom build request (referencing a past
// product they liked, or a free-text description if nothing matches).
router.post("/:slug/orders", (req, res) => {
  const fundi = store.get("users", (u) => u.slug === req.params.slug && u.role === "fundi");
  if (!fundi) return res.status(404).json({ error: "This storefront does not exist." });

  const { product_id, customer_name, customer_phone, order_type, payment_type, custom_description } = req.body || {};
  if (!customer_name || !customer_phone) {
    return res.status(400).json({ error: "Your name and phone number are required so the fundi can reach you." });
  }

  let product = null;
  if (product_id) {
    product = store.get("storefront_items", (i) => i.id === product_id && i.user_id === fundi.id);
    if (!product) return res.status(404).json({ error: "That product could not be found." });
  }

  const type = order_type === "custom" ? "custom" : "stock";
  if (type === "stock" && (!product || product.status !== "available")) {
    return res.status(400).json({ error: "This item isn't currently available to order directly — try requesting a custom build instead." });
  }

  const pType = payment_type === "hp" ? "hp" : "cash";
  const totalPrice = product ? (pType === "hp" ? product.hp_price : product.cash_price) : 0;

  const order = store.insert("orders", {
    fundi_id: fundi.id,
    product_id: product?.id || null,
    product_title: product?.title || custom_description || "Custom request",
    customer_name,
    customer_phone,
    order_type: type,
    payment_type: pType,
    total_price: totalPrice,
    amount_paid: 0,
    status: "requested",
    notes: type === "custom" ? (custom_description || "") : "",
    placed_by: "customer",
  });

  // A stock order reserves the item so it can't be double-sold while it's pending.
  if (type === "stock" && product) {
    store.update("storefront_items", (i) => i.id === product.id, { status: "reserved" });
  }

  res.status(201).json({ order, message: "Order sent! The fundi will confirm with you directly on WhatsApp." });
});

export default router;
