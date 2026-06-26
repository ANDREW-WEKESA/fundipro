import { useEffect, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner, Banner, StatCard } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function Stats() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get("/jobs/summary").then(({ data }) => setSummary(data));
    api.get("/orders").then(({ data }) => setOrders(data.orders));
    api.get("/reports/status").then(({ data }) => setReportStatus(data));
  }, []);

  async function downloadReport() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", { headers: { Authorization: `Bearer ${localStorage.getItem("fundipro_token")}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `FundiPro-Statement-${user.slug}-${new Date().toISOString().slice(0,10)}.pdf`; a.click();
      const { data } = await api.get("/reports/status");
      setReportStatus(data);
    } finally { setGenerating(false); }
  }

  const allOrders = orders || [];
  const openOrders = allOrders.filter((o) => !["completed","cancelled"].includes(o.status));
  const hpOrders = allOrders.filter((o) => o.payment_type === "hp" && !["completed","cancelled"].includes(o.status));
  const totalOwed = hpOrders.reduce((a, o) => a + (o.total_price - o.amount_paid), 0);

  return (
    <FundiLayout title="My Statistics">
      <div className="max-w-5xl space-y-7">

        {/* 20-day report */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="section-title">📄 Business Statement</h2>
              <p className="text-sm mt-1" style={{color:"var(--muted)"}}>
                {reportStatus ? (
                  reportStatus.due
                    ? `Your ${reportStatus.interval_days}-day statement is ready — last generated ${reportStatus.days_since} days ago.`
                    : `Next statement in ${reportStatus.interval_days - reportStatus.days_since} days.`
                ) : "Loading…"}
              </p>
            </div>
            <button onClick={downloadReport} disabled={generating} className="btn-primary shrink-0">
              {generating ? "Generating PDF…" : "⬇️ Download PDF statement"}
            </button>
          </div>
          <p className="text-xs mt-3" style={{color:"var(--muted)"}}>
            A full record of all your jobs, orders, and low-stock materials for this period. Save it, print it, or share it with your bank or SACCO for a loan application.
          </p>
        </div>

        {/* Summary stats */}
        {!summary ? <Spinner/> : (
          <>
            <div>
              <h2 className="section-title mb-4">This month</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="💰" label="Profit" value={`KES ${summary.this_month.profit.toLocaleString()}`} accent="text-good"/>
                <StatCard icon="📦" label="Revenue" value={`KES ${summary.this_month.revenue.toLocaleString()}`}/>
                <StatCard icon="🔨" label="Jobs" value={summary.this_month.jobs}/>
                <StatCard icon="📋" label="Open orders" value={openOrders.length}/>
              </div>
            </div>
            <div>
              <h2 className="section-title mb-4">All time</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="💰" label="Total profit" value={`KES ${summary.all_time.profit.toLocaleString()}`} accent="text-good"/>
                <StatCard icon="📦" label="Total revenue" value={`KES ${summary.all_time.revenue.toLocaleString()}`}/>
                <StatCard icon="🔨" label="Total jobs" value={summary.all_time.jobs}/>
                <StatCard icon="👁️" label="Storefront views" value={user.views ?? 0}/>
              </div>
            </div>
          </>
        )}

        {/* HP / Installment tracker */}
        {hpOrders.length > 0 && (
          <div>
            <h2 className="section-title mb-4">Hire Purchase (outstanding)</h2>
            <Banner kind="warn">Customers still owe you KES {totalOwed.toLocaleString()} across {hpOrders.length} HP {hpOrders.length === 1 ? "order" : "orders"}.</Banner>
            <div className="space-y-3 mt-3">
              {hpOrders.map((o) => {
                const balance = o.total_price - o.amount_paid;
                const pct = o.total_price > 0 ? Math.round((o.amount_paid / o.total_price) * 100) : 0;
                return (
                  <div key={o.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" style={{color:"var(--ink)"}}>{o.product_title}</p>
                        <p className="text-xs" style={{color:"var(--muted)"}}>{o.customer_name} · {o.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-bad">KES {balance.toLocaleString()} owed</p>
                        <p className="text-xs" style={{color:"var(--muted)"}}>{pct}% paid</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mt-2" style={{background:"var(--bg)"}}>
                      <div className="h-full rounded-full bg-good" style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FundiLayout>
  );
}
