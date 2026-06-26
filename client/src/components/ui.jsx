export function TierBadge({ tier }) {
  const s = { free:"bg-sand text-bark", pro:"bg-terracotta text-white", business:"bg-bark text-white" };
  const l = { free:"Free", pro:"Pro", business:"Business" };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${s[tier]||s.free}`}>{l[tier]||tier}</span>;
}

export function StatusPill({ status }) {
  const labels = { in_progress:"In Progress", available:"Available", reserved:"Reserved", sold:"Sold" };
  return <span className={`status-${status} inline-flex items-center rounded-full px-3 py-1 text-xs font-bold`}>{labels[status]||status}</span>;
}

export function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="card">
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{color:"var(--muted)"}}>{label}</p>
      <p className={`mt-2 text-3xl font-display font-bold ${accent||"text-bark"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs" style={{color:"var(--muted)"}}>{sub}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="card flex flex-col items-center text-center py-14">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="section-title">{title}</h3>
      {body && <p className="mt-2 text-sm max-w-sm" style={{color:"var(--muted)"}}>{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label="Loading…" }) {
  return (
    <div className="flex items-center gap-2.5 text-sm py-12 justify-center" style={{color:"var(--muted)"}}>
      <span className="h-5 w-5 rounded-full border-2 border-terracotta border-t-transparent animate-spin"/>
      {label}
    </div>
  );
}

export function Banner({ kind="info", children }) {
  const s = {
    info:"bg-sand/50 text-bark border-sand",
    error:"bg-bad/10 text-bad border-bad/20",
    success:"bg-good/10 text-good border-good/20",
    warn:"bg-terracotta/10 text-terracotta-dark border-terracotta/20",
  };
  return <div className={`rounded-xl px-4 py-3 text-sm border ${s[kind]}`}>{children}</div>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-bark/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className={`rounded-2xl shadow-card w-full ${wide?"max-w-2xl":"max-w-md"}`} style={{background:"var(--card)"}}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{borderColor:"var(--border)"}}>
          <h2 className="font-display text-lg font-bold" style={{color:"var(--ink)"}}>{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-bark text-xl leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function MotivationalQuote() {
  const quotes = [
    { q:"The fundi who tracks every job is the fundi who never works at a loss without knowing it.", a:"FundiPro" },
    { q:"Your workshop is your kingdom. Run it like a business, not a guess.", a:"Andrew Wekesa" },
    { q:"Every shilling tracked today is a loan approved tomorrow.", a:"FundiPro" },
    { q:"Be your own boss. Manage your own business. Build your own future.", a:"FundiPro" },
    { q:"A record is proof. Proof is trust. Trust is your next big client.", a:"Andrew Wekesa" },
    { q:"Don't give up. The fundi who shows up every day and logs every job outlasts everyone.", a:"FundiPro" },
    { q:"You are not just a carpenter, welder, or tailor. You are a business owner.", a:"FundiPro" },
  ];
  const pick = quotes[Math.floor(Math.random() * quotes.length)];
  return (
    <div className="rounded-2xl bg-bark text-white px-6 py-5">
      <p className="text-sm leading-relaxed italic text-sand/90">"{pick.q}"</p>
      <p className="text-xs font-bold text-terracotta-light mt-2">— {pick.a}</p>
    </div>
  );
}
