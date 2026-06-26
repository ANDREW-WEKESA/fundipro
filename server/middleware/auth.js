import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { store } from "../db/store.js";

// Verifies the Bearer token, attaches req.user (full user row, password stripped).
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = store.get("users", (u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Account no longer exists." });
    if (user.status === "suspended") {
      return res.status(403).json({
        error: "This account has been suspended. Please contact FundiPro support to resolve this.",
        code: "ACCOUNT_SUSPENDED",
      });
    }
    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// Use after requireAuth to restrict a route to admins.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}
