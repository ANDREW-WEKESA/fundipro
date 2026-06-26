// db/seed.js — populates demo data so the app feels alive on first run.
// Run with: npm run seed

import bcrypt from "bcryptjs";
import { store } from "./store.js";

store.reset();

const hash = (pw) => bcrypt.hashSync(pw, 10);
const monthKey = new Date().toISOString().slice(0, 7);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// --- Admin (Andrew) ---
const admin = store.insert("users", {
  name: "Andrew Wekesa",
  phone: "0710435113",
  password_hash: hash("admin123"),
  role: "admin",
  trade: "Platform Admin",
  location: "Kisii Town",
  slug: "andrew-admin",
  tier: "business",
  tier_status: "active",
  status: "active",
  jobs_count_this_month: 0,
  month_key: monthKey,
  whatsapp: "0107875549",
  bio: "Founder of FundiPro.",
  photo_url: null,
  theme: "light",
});

// --- Demo fundis ---
const fundiSeeds = [
  { name: "John Mose", phone: "0711111111", trade: "Carpenter", location: "Daraja Mbili, Kisii", tier: "pro",
    bio: "Custom furniture and cabinet maker, 7 years experience.", whatsapp: "0711111111" },
  { name: "Grace Nyaboke", phone: "0722222222", trade: "Tailor", location: "Kisii Town Centre", tier: "pro",
    bio: "Dresses, school uniforms, and alterations.", whatsapp: "0722222222" },
  { name: "Peter Ondieki", phone: "0733333333", trade: "Welder", location: "Mwembe, Kisii", tier: "free",
    bio: "Gates, grills, and metal fabrication.", whatsapp: "0733333333" },
  { name: "Mary Kerubo", phone: "0744444444", trade: "Salon & Beauty", location: "Kisii Market", tier: "business",
    bio: "Braiding, treatments, and bridal styling.", whatsapp: "0744444444" },
  { name: "Samuel Otieno", phone: "0755555555", trade: "Mechanic", location: "Garage Row, Kisii", tier: "free",
    bio: "Car and motorbike repair, 10 years on the job.", whatsapp: "0755555555" },
];

const password = "fundi123";
const fundis = fundiSeeds.map((f) =>
  store.insert("users", {
    ...f,
    password_hash: hash(password),
    role: "fundi",
    slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    tier_status: "active",
    status: "active",
    jobs_count_this_month: 0,
    month_key: monthKey,
    photo_url: null,
    theme: "light",
    views: Math.floor(Math.random() * 40),
    created_at: daysAgo(45),
  })
);

// --- Jobs for the first couple of fundis ---
const jobTemplates = [
  { title: "Wooden bed frame", sale_price: 25000, material_cost: 14000, labour_cost: 4000, transport_cost: 800, created_at: daysAgo(12) },
  { title: "Kitchen cabinet set", sale_price: 48000, material_cost: 27000, labour_cost: 9000, transport_cost: 1500, created_at: daysAgo(6) },
  { title: "Office desk", sale_price: 15000, material_cost: 8000, labour_cost: 3000, transport_cost: 500, created_at: daysAgo(1) },
];
for (const t of jobTemplates) {
  const profit = t.sale_price - t.material_cost - t.labour_cost - t.transport_cost;
  store.insert("jobs", {
    user_id: fundis[0].id,
    ...t,
    profit,
    margin_pct: Math.round((profit / t.sale_price) * 1000) / 10,
    client_name: "Mama Risper",
  });
}
store.update("users", (u) => u.id === fundis[0].id, { jobs_count_this_month: jobTemplates.length });

const dressJobs = [
  { title: "Bridal gown", sale_price: 18000, material_cost: 9000, labour_cost: 3500, transport_cost: 300, client_name: "Esther W.", created_at: daysAgo(9) },
  { title: "School uniform batch (20pc)", sale_price: 22000, material_cost: 13000, labour_cost: 4000, transport_cost: 600, client_name: "St. Mary's Academy", created_at: daysAgo(3) },
];
for (const t of dressJobs) {
  const profit = t.sale_price - t.material_cost - t.labour_cost - t.transport_cost;
  store.insert("jobs", { user_id: fundis[1].id, ...t, profit, margin_pct: Math.round((profit / t.sale_price) * 1000) / 10 });
}
store.update("users", (u) => u.id === fundis[1].id, { jobs_count_this_month: dressJobs.length });

// --- Storefront catalogue items (products) ---
// cash_price / hp_price (hire-purchase is always priced a bit higher than cash)
// status: in_progress (not yet finished, shows as "coming soon") | available (orderable) | reserved | sold
const products = [
  { user_id: fundis[0].id, title: "Mahogany dining table", description: "Seats 6, solid mahogany.", cash_price: 38000, hp_price: 44000, status: "available", photos: [], completed_at: daysAgo(20) },
  { user_id: fundis[0].id, title: "Bedside table (pair)", description: "Two matching bedside tables.", cash_price: 9500, hp_price: 11000, status: "available", photos: [], completed_at: daysAgo(15) },
  { user_id: fundis[0].id, title: "L-shaped office desk", description: "In the workshop — almost done.", cash_price: 27000, hp_price: 31000, status: "in_progress", photos: [], completed_at: null },
  { user_id: fundis[1].id, title: "Custom Ankara dress", description: "Made to measure, 5-day turnaround.", cash_price: 4500, hp_price: 5200, status: "available", photos: [], completed_at: daysAgo(10) },
  { user_id: fundis[3].id, title: "Bridal package", description: "Hair, makeup, and nails for the big day.", cash_price: 12000, hp_price: 14000, status: "available", photos: [], completed_at: daysAgo(30) },
];
const productRows = products.map((p) => store.insert("storefront_items", p));

// --- Reviews ---
store.insert("reviews", { user_id: fundis[0].id, reviewer_name: "Esther W.", rating: 5, comment: "Beautiful work, delivered on time!" });
store.insert("reviews", { user_id: fundis[0].id, reviewer_name: "Brian K.", rating: 4, comment: "Good quality, slightly delayed delivery." });
store.insert("reviews", { user_id: fundis[1].id, reviewer_name: "St. Mary's Academy", rating: 5, comment: "Reliable for bulk uniform orders every term." });
store.insert("reviews", { user_id: fundis[3].id, reviewer_name: "Faith N.", rating: 5, comment: "Did my wedding look perfectly. Highly recommend!" });

// --- Payments ---
store.insert("payments", { user_id: fundis[0].id, tier: "pro", amount: 500, status: "success", mpesa_ref: "MPESA8X2K9F1A" });
store.insert("payments", { user_id: fundis[1].id, tier: "pro", amount: 500, status: "success", mpesa_ref: "MPESA7H3J2P0Q" });
store.insert("payments", { user_id: fundis[3].id, tier: "business", amount: 1200, status: "success", mpesa_ref: "MPESA1Z9Y8X7W" });

// --- Support tickets ---
store.insert("tickets", { user_id: fundis[2].id, user_name: fundis[2].name, subject: "Can't upload job photo", message: "The photo upload button doesn't respond on my phone.", status: "open" });
store.insert("tickets", { user_id: fundis[4].id, user_name: fundis[4].name, subject: "M-Pesa payment not reflecting", message: "I paid for Pro but my account still shows Free.", status: "open" });

// --- Materials / tools store ---
store.insert("materials", { user_id: fundis[0].id, name: "Mahogany timber (4x2)", quantity: 18, unit: "pieces", low_stock_threshold: 5 });
store.insert("materials", { user_id: fundis[0].id, name: "Wood glue", quantity: 2, unit: "litres", low_stock_threshold: 3 });
store.insert("materials", { user_id: fundis[0].id, name: "Sandpaper (120 grit)", quantity: 40, unit: "sheets", low_stock_threshold: 10 });
store.insert("materials", { user_id: fundis[1].id, name: "Ankara fabric", quantity: 12, unit: "metres", low_stock_threshold: 5 });
store.insert("materials", { user_id: fundis[1].id, name: "Thread (assorted)", quantity: 3, unit: "spools", low_stock_threshold: 5 });

// --- Orders (a mix of stock + custom, cash + HP) ---
store.insert("orders", {
  fundi_id: fundis[0].id, product_id: productRows[1].id, product_title: "Bedside table (pair)",
  customer_name: "Janet M.", customer_phone: "0798111222", order_type: "stock", payment_type: "cash",
  total_price: 9500, amount_paid: 9500, status: "completed", notes: "", placed_by: "customer",
});
store.insert("orders", {
  fundi_id: fundis[0].id, product_id: productRows[0].id, product_title: "Mahogany dining table",
  customer_name: "Robert K.", customer_phone: "0798333444", order_type: "stock", payment_type: "hp",
  total_price: 44000, amount_paid: 20000, status: "partial", notes: "", placed_by: "fundi",
});
store.insert("orders", {
  fundi_id: fundis[1].id, product_id: null, product_title: "Custom suit, navy blue",
  customer_name: "David O.", customer_phone: "0798555666", order_type: "custom", payment_type: "cash",
  total_price: 0, amount_paid: 0, status: "requested", notes: "Wants something like the bridal gown but in navy for a graduation.", placed_by: "customer",
});

// Reflect the reserved table in the product's own status
store.update("storefront_items", (i) => i.id === productRows[0].id, { status: "reserved" });

// --- Messages (a sample admin <-> fundi chat thread) ---
store.insert("messages", { from_user_id: fundis[2].id, to_user_id: admin.id, body: "Habari Andrew, my M-Pesa upgrade to Pro didn't go through, can you check?", system: false, read: true });
store.insert("messages", { from_user_id: admin.id, to_user_id: fundis[2].id, body: "Nimeona Peter, looking into it now — give me a few minutes.", system: false, read: true });

console.log("Seed complete.");
console.log("Admin login   -> phone: 0710435113  password: admin123");
console.log("Fundi login   -> phone: 0711111111  password: fundi123  (John Mose, Pro, storefront: john-mose)");
console.log("Free fundi    -> phone: 0733333333  password: fundi123  (Peter Ondieki, Free)");
