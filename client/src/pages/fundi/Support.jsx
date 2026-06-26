import { useEffect, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Banner, EmptyState } from "../../components/ui";
import api, { errMsg } from "../../lib/api";

export default function Support() {
  const [tickets, setTickets] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function load() {
    api.get("/users/tickets").then(({ data }) => setTickets(data.tickets));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users/tickets", form);
      setForm({ subject: "", message: "" });
      setSent(true);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <FundiLayout title="Support">
      <div className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={submit} className="lg:col-span-2 card h-fit space-y-4">
          <h2 className="font-display font-bold text-bark">Raise a ticket</h2>
          {error && <Banner kind="error">{error}</Banner>}
          {sent && <Banner kind="success">Sent — we'll get back to you soon.</Banner>}
          <div>
            <label className="label">Subject</label>
            <input className="input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          </div>
          <button className="btn-primary w-full">Send</button>
        </form>

        <div className="lg:col-span-3">
          <h2 className="font-display font-bold text-bark mb-3">Your tickets</h2>
          {tickets === null ? null : tickets.length === 0 ? (
            <EmptyState icon="💬" title="No tickets yet" body="Questions or bugs? Raise a ticket and the FundiPro team will respond." />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-bark">{t.subject}</p>
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${t.status === "open" ? "bg-terracotta/15 text-terracotta-dark" : "bg-good/15 text-good"}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1.5">{t.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FundiLayout>
  );
}
