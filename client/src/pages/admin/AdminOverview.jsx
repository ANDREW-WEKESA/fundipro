import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { StatCard, Spinner } from "../../components/ui";
import api from "../../lib/api";

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span style={{color:"var(--ink)"}}>{label}</span>
        <span style={{color:"var(--muted)"}}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--bg)"}}>
        <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, backgroundColor: color}}/>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(({ data }) => setStats(data)); }, []);
  if (!stats) return <AdminLayout title="Platform Overview"><Spinner/></AdminLayout>;

  const trades = Object.entries(stats.by_trade||{}).sort((a,b) => b[1]-a[1]);
  const locs   = Object.entries(stats.by_location||{}).sort((a,b) => b[1]-a[1]);
  const maxT = Math.max(...trades.map(([,v]) => v), 1);
  const maxL = Math.max(...locs.map(([,v]) => v), 1);

  return (
    <AdminLayout title="Platform Overview">
      <div className="space-y-7 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total fundis"   value={stats.total_fundis}/>
          <StatCard icon="💰" label="Monthly recurring revenue" value={`KES ${stats.mrr.toLocaleString()}`} accent="text-good"/>
          <StatCard icon="📦" label="Total collected" value={`KES ${stats.total_collected.toLocaleString()}`}/>
          <StatCard icon="🎫" label="Open tickets" value={stats.open_tickets} accent={stats.open_tickets > 0 ? "text-terracotta" : "text-bark"}/>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[["Free",stats.by_tier?.free||0,"fundis on the free tier",false],
            ["Pro",stats.by_tier?.pro||0,"paying KES 500/mo",true],
            ["Business",stats.by_tier?.business||0,"paying KES 1,200/mo",false]].map(([name,val,sub,hl]) => (
            <div key={name} className={`card ${hl ? "ring-1 ring-terracotta" : ""}`}>
              <h3 className={`font-display font-bold mb-1 ${hl ? "text-terracotta" : ""}`} style={hl ? {} : {color:"var(--ink)"}}>{name}</h3>
              <p className="font-display text-3xl font-bold" style={{color:"var(--ink)"}}>{val}</p>
              <p className="text-xs mt-1" style={{color:"var(--muted)"}}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card space-y-3.5">
            <h3 className="section-title">Most active trades</h3>
            {trades.map(([t,c]) => <BarRow key={t} label={t} value={c} max={maxT} color="#B85042"/>)}
          </div>
          <div className="card space-y-3.5">
            <h3 className="section-title">By location</h3>
            {locs.map(([l,c]) => <BarRow key={l} label={l} value={c} max={maxL} color="#A7BEAE"/>)}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
