import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Spinner, EmptyState } from "../../components/ui";
import api from "../../lib/api";

export default function AdminSupport() {
  const [tickets, setTickets] = useState(null);
  function load() { api.get("/admin/tickets").then(({ data }) => setTickets(data.tickets)); }
  useEffect(load, []);
  async function resolve(id) { await api.patch(`/admin/tickets/${id}`, { status:"resolved" }); load(); }

  return (
    <AdminLayout title="Support Tickets">
      {tickets === null ? <Spinner/> : tickets.length === 0 ? (
        <EmptyState icon="✅" title="No tickets" body="Nothing from fundis right now."/>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {tickets.map((t) => (
            <div key={t.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold" style={{color:"var(--ink)"}}>{t.subject}</p>
                  <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${t.status==="open" ? "bg-terracotta/15 text-terracotta-dark" : "bg-good/15 text-good"}`}>{t.status}</span>
                </div>
                <p className="text-xs mt-1" style={{color:"var(--muted)"}}>{t.user_name} · {new Date(t.created_at).toLocaleDateString()}</p>
                <p className="text-sm mt-2" style={{color:"var(--muted)"}}>{t.message}</p>
              </div>
              {t.status === "open" && (
                <button onClick={() => resolve(t.id)} className="btn-secondary shrink-0 text-xs">Mark resolved</button>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
