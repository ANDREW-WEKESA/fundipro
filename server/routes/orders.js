import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const ORDER_STATUSES = ["requested", "confirmed", "partial", "paid", "ready_for_pickup", "completed", "cancelled"];

// ---- fundi-authenticated routes ----
router.use(requireAuth);

// GET /api/orders — this fundi's orders (newest first)
router.get("/", (req, res) => {
  const orders = store
    .all("orders", (o) => o.fundi_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ orders });
});

// POST /api/orders — fundi places an order ON BEHALF OF a customer (walk-in, phone call, etc.)
router.post("/", (req, res) => {
  const { product_id, customer_name, customer_phone, payment_type, custom_description } = req.body || {};
  if (!customer_name) return res.status(400).json({ error: "Customer name is required." });

  let product = null;
  if (product_id) {
    product = store.get("storefront_items", (i) => i.id === product_id && i.user_id === req.user.id);
  }
  const pType = payment_type === "hp" ? "hp" : "cash";
  const totalPrice = product ? (pType === "hp" ? product.hp_price : product.cash_price) : Number(req.body.total_price) || 0;

  const order = store.insert("orders", {
    fundi_id: req.user.id,
    product_id: product?.id || null,
    product_title: product?.title || custom_description || "Custom order",
    customer_name,
    customer_phone: customer_phone || "",
    order_type: product ? "stock" : "custom",
    payment_type: pType,
    total_price: totalPrice,
    amount_paid: 0,
    status: "confirmed",
    notes: custom_description || "",
    placed_by: "fundi",
  });

  if (product) store.update("storefront_items", (i) => i.id === product.id, { status: "reserved" });

  res.status(201).json({ order });
});

// PATCH /api/orders/:id — update status / record a payment toward an HP order
router.patch("/:id", (req, res) => {
  const order = store.get("orders", (o) => o.id === req.params.id && o.fundi_id === req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found." });

  const patch = {};
  if (req.body.status && ORDER_STATUSES.includes(req.body.status)) patch.status = req.body.status;
  if (req.body.add_payment != null) {
    const add = Math.abs(Number(req.body.add_payment)) || 0;
    patch.amount_paid = Math.min(order.amount_paid + add, order.total_price);
    if (patch.amount_paid >= order.total_price && order.total_price > 0) {
      patch.status = "paid";
    } else if (patch.amount_paid > 0) {
      patch.status = "partial";
    }
  }

  const updated = store.update("orders", (o) => o.id === order.id, patch);

  // Keep the linked product's storefront status in sync with the order lifecycle.
  if (updated.product_id) {
    if (updated.status === "paid" || updated.status === "ready_for_pickup") {
      store.update("storefront_items", (i) => i.id === updated.product_id, { status: "reserved" });
    }
    if (updated.status === "completed") {
      store.update("storefront_items", (i) => i.id === updated.product_id, { status: "sold" });
    }
    if (updated.status === "cancelled") {
      store.update("storefront_items", (i) => i.id === updated.product_id, { status: "available" });
    }
  }

  res.json({ order: updated });
});

export default router;
