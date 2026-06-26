import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FundiLayout from "./FundiLayout";
import { Banner, EmptyState, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

const STATUSES = ["pending", "paid", "overdue"];

export default function Clients() {
  const { tierConfig } = useAuth();
  const [clients, setClients] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  function load() {
    api
      .get("/clients")
      .then(({ data }) => setClients(data.clients))
      .catch((err) => {
        if (err.response?.status === 402) setLocked(true);
        else setError(errMsg(err));
      });
  }

  useEffect(load, []);

  async function addClient(e) {
    e.preventDefault();
    if (!form.name) return;
    const { data } = await api.post("/clients", form);
    setClients((c) => [data.client, ...c]);
    setForm({ name: "", phone: "", notes: "" });
  }

  async function cycleStatus(client) {
    const next = STATUSES[(STATUSES.indexOf(client.payment_status) + 1) % STATUSES.length];
    const { data } = await api.patch(`/clients/${client.id}`, { payment_status: next });
    setClients((cs) => cs.map((c) => (c.id === client.id ? data.client : c)));
  }

  async function remove(id) {
    await api.delete(`/clients/${id}`);
    setClients((cs) => cs.filter((c) => c.id !== id));
  }

  if (locked || !tierConfig?.clientManagement) {
    return (
      <FundiLayout title="Clients">
        <EmptyState
          icon="🔒"
          title="Client management is a Business feature"
          body="Track contacts, orders, and payment status in one place. Upgrade to Business to unlock it."
          action={<Link to="/app/billing" className="btn-primary">View Business plan</Link>}
        />
      </FundiLayout>
    );
  }

  const statusStyle = { pending: "bg-sand text-bark", paid: "bg-good/15 text-good", overdue: "bg-bad/15 text-bad" };

  return (
    <FundiLayout title="Clients">
      <div className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={addClient} className="lg:col-span-2 card h-fit space-y-4">
          <h2 className="font-display font-bold text-bark">Add a client</h2>
          {error && <Banner kind="error">{error}</Banner>}
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <button className="btn-primary w-full">Add client</button>
        </form>

        <div className="lg:col-span-3">
          <h2 className="font-display font-bold text-bark mb-3">Your clients</h2>
          {clients === null ? (
            <Spinner />
          ) : clients.length === 0 ? (
            <EmptyState icon="👥" title="No clients yet" body="Add clients to keep track of orders and who still owes you." />
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <div key={c.id} className="card flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-bark truncate">{c.name}</p>
                    <p className="text-xs text-muted mt-0.5">{c.phone}{c.notes ? ` · ${c.notes}` : ""}</p>
                  </div>
                  <button
                    onClick={() => cycleStatus(c)}
                    className={`text-xs font-semibold rounded-full px-3 py-1 shrink-0 ${statusStyle[c.payment_status]}`}
                    title="Click to cycle status"
                  >
                    {c.payment_status}
                  </button>
                  <button onClick={() => remove(c.id)} className="text-muted hover:text-bad text-sm shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FundiLayout>
  );
}
