import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FundiLayout from "./FundiLayout";
import { StatCard, Spinner, Banner, MotivationalQuote } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function Dashboard() {
  const { user, tierConfig } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [materials, setMaterials] = useState(null);

  useEffect(() => {
    api.get("/jobs/summary").then(({ data }) => setSummary(data));
    api.get("/reports/status").then(({ data }) => setReportStatus(data));
    api.get("/materials").then(({ data }) => setMaterials(data));
  }, []);

  if (!summary) return <FundiLayout title="Overview"><Spinner/></FundiLayout>;

  const jobsLeft = tierConfig?.jobLimitPerMonth != null
    ? Math.max(tierConfig.jobLimitPerMonth - (user.jobs_count_this_month || 0), 0)
    : null;
  const lowStockCount = materials?.low_stock_count || 0;

  return (
    <FundiLayout title={`Habari, ${user.name?.split(" ")[0]} 👋`}>
      <div className="space-y-6 max-w-5xl">

        {/* Tier limit warning */}
        {user.tier === "free" && jobsLeft === 0 && (
          <Banner kind="warn">
            You've used all 3 free jobs this month.{" "}
            <Link to="/app/billing" className="font-bold underline">Upgrade to Pro</Link> for unlimited jobs + a public storefront that gets you new clients.
          </Banner>
        )}

        {/* 20-day report due */}
        {reportStatus?.due && (
          <Banner kind="info">
            📄 Your 20-day business statement is ready.{" "}
            <Link to="/app/stats" className="font-bold underline">Download it now →</Link>
          </Banner>
        )}

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <Banner kind="warn">
            ⚠️ {lowStockCount} {lowStockCount === 1 ? "material is" : "materials are"} running low in your tools store.{" "}
            <Link to="/app/materials" className="font-bold underline">Restock now →</Link>
          </Banner>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="💰" label="Profit this month" value={`KES ${summary.this_month.profit.toLocaleString()}`} accent="text-good" sub={`${summary.this_month.jobs} jobs recorded`}/>
          <StatCard icon="📦" label="Revenue this month" value={`KES ${summary.this_month.revenue.toLocaleString()}`} sub="from sale prices"/>
          <StatCard icon="🔢" label="Jobs remaining" value={jobsLeft === null ? "Unlimited" : jobsLeft} sub={user.tier === "free" ? "resets next month" : "Pro plan"}/>
          <StatCard icon="👁️" label="Storefront views" value={user.views ?? "—"} sub={user.tier === "free" ? "upgrade to go public" : "all-time"}/>
        </div>

        {/* Lifetime + Quick actions */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="section-title mb-1">Lifetime totals</h2>
            <p className="text-sm mb-4" style={{color:"var(--muted)"}}>Every job ever recorded on FundiPro.</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-display font-bold">{summary.all_time.jobs}</p>
                <p className="text-xs mt-1" style={{color:"var(--muted)"}}>Jobs</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold">KES {(summary.all_time.revenue/1000).toFixed(0)}k</p>
                <p className="text-xs mt-1" style={{color:"var(--muted)"}}>Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-good">KES {(summary.all_time.profit/1000).toFixed(0)}k</p>
                <p className="text-xs mt-1" style={{color:"var(--muted)"}}>Profit</p>
              </div>
            </div>
          </div>
          <div className="card space-y-2.5">
            <h2 className="section-title mb-3">Quick actions</h2>
            <Link to="/app/jobs" className="btn-primary w-full justify-start">🧮 Record a new job</Link>
            <Link to="/app/products" className="btn-secondary w-full justify-start">🛠️ Add a product to my store</Link>
            <Link to="/app/orders" className="btn-secondary w-full justify-start">📋 View my orders</Link>
            {user.tier === "free" && <Link to="/app/billing" className="btn-ghost w-full justify-start text-terracotta">⬆️ Upgrade plan</Link>}
          </div>
        </div>

        {/* Motivational quote */}
        <MotivationalQuote/>

        {/* Reminder to log daily */}
        <div className="card border-l-4 border-terracotta">
          <p className="text-sm font-semibold" style={{color:"var(--ink)"}}>💡 Reminder from Andrew</p>
          <p className="text-sm mt-1" style={{color:"var(--muted)"}}>
            Record every job — even the small ones. Your 20-day business statement and your loan application someday depend on it. Fundis who track everything grow faster than those who guess. Don't give up.
          </p>
        </div>
      </div>
    </FundiLayout>
  );
}
