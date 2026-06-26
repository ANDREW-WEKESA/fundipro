import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const REMINDER_MESSAGES = [
  "Habari! Don't forget to record today's job in your Cost Calculator — even a small one. Future-you will thank you when it's report time.",
  "Quick reminder: a fundi who tracks every job is a fundi who never works at a loss without knowing it. Log today's work when you get a chance.",
  "Hujarecord kazi ya leo bado? Take two minutes to add it — your profit history is what makes you bankable.",
  "Consistency builds the record that gets you loans, trust, and bigger clients. Don't skip today's entry.",
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function findAdmin() {
  return store.get("users", (u) => u.role === "admin");
}

// Inserts one automated reminder per fundi per day if they haven't logged a job yet today.
function maybeInsertDailyReminder(fundi) {
  const today = todayKey();
  const loggedToday = store.get("jobs", (j) => j.user_id === fundi.id && j.created_at.slice(0, 10) === today);
  if (loggedToday) return;

  const alreadyReminded = store.get(
    "messages",
    (m) => m.to_user_id === fundi.id && m.from_user_id === "system" && m.created_at.slice(0, 10) === today
  );
  if (alreadyReminded) return;

  const text = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  store.insert("messages", { from_user_id: "system", to_user_id: fundi.id, body: text, system: true, read: false });
}

// GET /api/messages — fundi: thread with Andrew. admin: pass ?with=<fundi_id>.
router.get("/", (req, res) => {
  if (req.user.role === "admin") {
    const fundiId = req.query.with;
    if (!fundiId) return res.status(400).json({ error: "Pass ?with=<fundi_id> to view a conversation." });
    const messages = store
      .all("messages", (m) => (m.from_user_id === fundiId && m.to_user_id === req.user.id) || (m.from_user_id === req.user.id && m.to_user_id === fundiId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json({ messages });
    return;
  }

  maybeInsertDailyReminder(req.user);
  const admin = findAdmin();
  const messages = store
    .all(
      "messages",
      (m) =>
        (m.from_user_id === req.user.id && m.to_user_id === admin?.id) ||
        (m.from_user_id === admin?.id && m.to_user_id === req.user.id) ||
        (m.from_user_id === "system" && m.to_user_id === req.user.id)
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json({ messages });
});

// POST /api/messages — send a message
router.post("/", (req, res) => {
  const { body, to_user_id } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: "Message cannot be empty." });

  let toId = to_user_id;
  if (req.user.role === "fundi") {
    const admin = findAdmin();
    toId = admin?.id;
  } else if (!toId) {
    return res.status(400).json({ error: "to_user_id is required when sending as admin." });
  }

  const message = store.insert("messages", { from_user_id: req.user.id, to_user_id: toId, body: body.trim(), system: false, read: false });
  res.status(201).json({ message });
});

// GET /api/messages/conversations — admin only: one row per fundi with last message + unread count
router.get("/conversations", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only." });

  const fundis = store.all("users", (u) => u.role === "fundi");
  const conversations = fundis.map((f) => {
    const thread = store
      .all("messages", (m) => (m.from_user_id === f.id && m.to_user_id === req.user.id) || (m.from_user_id === req.user.id && m.to_user_id === f.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const unread = thread.filter((m) => m.from_user_id === f.id && !m.read).length;
    return {
      fundi_id: f.id,
      fundi_name: f.name,
      fundi_slug: f.slug,
      last_message: thread[0]?.body || null,
      last_message_at: thread[0]?.created_at || null,
      unread_count: unread,
    };
  });

  conversations.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
  res.json({ conversations });
});

export default router;
