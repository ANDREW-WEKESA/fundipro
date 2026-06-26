import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { TierBadge, Spinner, Banner, Modal } from "../../components/ui";
import api, { errMsg } from "../../lib/api";

export default function AdminFundis() {
  const [fundis, setFundis] = useState(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [suspending, setSuspending] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await api.get("/admin/fundis");
    setFundis(data.fundis);
  }
  useEffect(() => { load(); }, []);

  async function toggleStatus(fundi) {
    const next = fundi.status === "suspended" ? "active" : "suspended";
    setSuspending(true); setMsg("");
    try {
      await api.patch(`/admin/fundis/${fundi.id}/status`, { status: next });
      setMsg(`${fundi.name} has been ${next === "suspended" ? "suspended" : "reactivated"}.`);
      await load();
      setSelected(null);
    } catch(err) { setMsg(errMsg(err)); }
    finally { setSuspending(false); }
  }

  const filtered = (fundis||[]).filter((f) =>
    [f.name, f.trade, f.location, f.phone].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AdminLayout title="All Fundis"
      headerRight={
        <input className="input max-w-xs" placeholder="Search by name, trade, location…"
          value={q} onChange={(e) => setQ(e.target.value)}/>
      }>
      {msg && <Banner kind="info" className="mb-4">{msg}</Banner>}

      {selected && (
        <Modal title={`Manage: ${selected.name}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{color:"var(--muted)"}}>Phone:</span> <span className="font-semibold">{selected.phone}</span></div>
              <div><span style={{color:"var(--muted)"}}>Trade:</span> <span className="font-semibold">{selected.trade}</span></div>
              <div><span style={{color:"var(--muted)"}}>Location:</span> <span className="font-semibold">{selected.location}</span></div>
              <div><span style={{color:"var(--muted)"}}>Plan:</span> <TierBadge tier={selected.tier}/></div>
              <div><span style={{color:"var(--muted)"}}>Jobs:</span> <span className="font-semibold">{selected.job_count}</span></div>
              <div><span style={{color:"var(--muted)"}}>Revenue:</span> <span className="font-semibold">KES {selected.total_revenue?.toLocaleString()}</span></div>
            </div>

            <div className="flex gap-3">
              <a href={`/s/${selected.slug}`} target="_blank" rel="noreferrer" className="btn-secondary flex-1">🏪 View storefront</a>
              <Link to={`/admin/chat?with=${selected.id}`} className="btn-secondary flex-1" onClick={() => setSelected(null)}>💬 Message</Link>
            </div>

            {selected.status === "suspended" ? (
              <button onClick={() => toggleStatus(selected)} disabled={suspending} className="btn-primary w-full">
                {suspending ? "Reactivating…" : "✅ Reactivate account"}
              </button>
            ) : (
              <button onClick={() => toggleStatus(selected)} disabled={suspending} className="btn-danger w-full">
                {suspending ? "Suspending…" : "🚫 Suspend account"}
              </button>
            )}
            <p className="text-xs text-center" style={{color:"var(--muted)"}}>
              Suspended fundis cannot log in until you reactivate them. Use this only during genuine disputes.
            </p>
          </div>
        </Modal>
      )}

      {fundis === null ? <Spinner/> : (
        <div className="card !p-0 overflow-hidden max-w-6xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-widest" style={{color:"var(--muted)", borderColor:"var(--border)"}}>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Trade</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3 text-right">Jobs</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Storefront</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b last:border-0 hover:opacity-80 cursor-pointer transition-opacity"
                  style={{borderColor:"var(--border)"}}
                  onClick={() => setSelected(f)}>
                  <td className="px-5 py-3 font-medium" style={{color:"var(--ink)"}}>{f.name}</td>
                  <td className="px-5 py-3" style={{color:"var(--muted)"}}>{f.trade}</td>
                  <td className="px-5 py-3" style={{color:"var(--muted)"}}>{f.location}</td>
                  <td className="px-5 py-3"><TierBadge tier={f.tier}/></td>
                  <td className="px-5 py-3 text-right" style={{color:"var(--muted)"}}>{f.job_count}</td>
                  <td className="px-5 py-3 text-right" style={{color:"var(--muted)"}}>KES {f.total_revenue?.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${f.status==="suspended" ? "bg-bad/15 text-bad" : "bg-good/15 text-good"}`}>
                      {f.status === "suspended" ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/s/${f.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      className="text-terracotta font-medium hover:underline text-xs">/s/{f.slug}</a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center" style={{color:"var(--muted)"}}>No fundis match "{q}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
