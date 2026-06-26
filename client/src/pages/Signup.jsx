import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { Banner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import api, { errMsg } from "../lib/api";

const TRADES = ["Carpenter", "Welder", "Tailor", "Mechanic", "Electrician", "Plumber", "Salon & Beauty", "Caterer", "Other"];

export default function Signup() {
  const [form, setForm] = useState({ name: "", phone: "", password: "", trade: "Carpenter", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setError(errMsg(err, "Could not create your account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PublicNavbar />
      <div className="max-w-sm mx-auto px-5 py-16">
        <h1 className="font-display text-2xl font-bold text-bark text-center">Start free in a minute</h1>
        <p className="text-center text-sm text-muted mt-1">3 jobs/month free. No card needed.</p>
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          {error && <Banner kind="error">{error}</Banner>}
          <div>
            <label className="label">Your name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} required />
          </div>
          <div>
            <label className="label">Trade</label>
            <select className="input" value={form.trade} onChange={(e) => set("trade", e.target.value)}>
              {TRADES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Daraja Mbili, Kisii" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Creating account…" : "Create free account"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already on FundiPro? <Link to="/login" className="text-terracotta font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
