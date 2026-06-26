import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { Banner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import api, { errMsg } from "../lib/api";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, password });
      login(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      setError(errMsg(err, "Could not log in. Check your phone number and password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PublicNavbar />
      <div className="max-w-sm mx-auto px-5 py-16">
        <h1 className="font-display text-2xl font-bold text-bark text-center">Log in to FundiPro</h1>
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          {error && <Banner kind="error">{error}</Banner>}
          <div>
            <label className="label">Phone number</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0711111111" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
          <div className="text-xs text-muted bg-sand/40 rounded-lg p-3 space-y-1">
            <p className="font-semibold text-bark">Demo accounts</p>
            <p>Admin: 0700000000 / admin123</p>
            <p>Pro fundi: 0711111111 / fundi123</p>
            <p>Free fundi: 0733333333 / fundi123</p>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          New to FundiPro? <Link to="/signup" className="text-terracotta font-semibold">Create a free account</Link>
        </p>
      </div>
    </div>
  );
}
