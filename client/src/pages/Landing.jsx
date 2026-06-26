import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

function MiniCalculator() {
  const [sale, setSale] = useState(25000);
  const [material, setMaterial] = useState(14000);
  const [labour, setLabour] = useState(4000);
  const [transport, setTransport] = useState(800);

  const profit = useMemo(() => {
    const s = Number(sale) || 0, m = Number(material) || 0, l = Number(labour) || 0, t = Number(transport) || 0;
    return s - m - l - t;
  }, [sale, material, labour, transport]);

  const margin = sale > 0 ? Math.round((profit / sale) * 100) : 0;

  const Field = ({ label, value, onChange }) => (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-sand/70">{label}</label>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-3 py-2">
        <span className="text-sand/60 text-sm">KES</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-white text-sm w-full outline-none placeholder:text-sand/40"
        />
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-bark-card border border-white/10 p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-light mb-4">
        Try it — this is the actual cost calculator
      </p>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Job: wooden bed frame — sale price" value={sale} onChange={setSale} />
        <Field label="Material cost" value={material} onChange={setMaterial} />
        <Field label="Labour cost" value={labour} onChange={setLabour} />
        <Field label="Transport cost" value={transport} onChange={setTransport} />
      </div>
      <div className="mt-5 flex items-end justify-between rounded-xl bg-terracotta/15 border border-terracotta/30 px-4 py-3.5">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-sand/70 font-semibold">Your real profit</p>
          <p className="font-display text-3xl font-bold text-white">KES {profit.toLocaleString()}</p>
        </div>
        <p className="text-sm font-semibold text-terracotta-light">{margin}% margin</p>
      </div>
    </div>
  );
}

function PricingCard({ name, price, features, highlight, who }) {
  return (
    <div
      className={`rounded-2xl p-7 border ${
        highlight ? "bg-terracotta border-terracotta text-white shadow-card scale-[1.03]" : "bg-white border-bark/10"
      }`}
    >
      {highlight && (
        <span className="inline-block rounded-full bg-bark text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 mb-4">
          Most popular
        </span>
      )}
      <h3 className={`font-display text-xl font-bold ${highlight ? "text-white" : "text-bark"}`}>{name}</h3>
      <p className={`mt-2 font-display text-3xl font-bold ${highlight ? "text-white" : "text-bark"}`}>
        KES {price}
        <span className={`text-sm font-body font-normal ${highlight ? "text-sand" : "text-muted"}`}>/month</span>
      </p>
      <ul className="mt-5 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className={highlight ? "text-sand" : "text-ink"}>
            • {f}
          </li>
        ))}
      </ul>
      <p className={`mt-5 text-xs italic ${highlight ? "text-sand/80" : "text-muted"}`}>{who}</p>
      <Link to="/signup" className={`mt-5 block text-center ${highlight ? "btn-dark w-full" : "btn-primary w-full"}`}>
        Start with {name}
      </Link>
    </div>
  );
}

export default function Landing() {
  return (
    <div>
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-bark text-white">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
              Know your real profit.
              <br />
              <span className="text-terracotta-light">Get found by new clients.</span>
            </h1>
            <p className="mt-5 text-sand/85 text-lg max-w-md">
              FundiPro is the free business toolkit for Kenyan carpenters, welders, tailors, mechanics, and
              every fundi who deserves to run a real business — not just guess.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary text-base px-7 py-3">Start free — 3 jobs/month</Link>
              <a href="#how-it-works" className="btn-secondary !bg-transparent !border-white/25 !text-white text-base px-7 py-3 hover:!bg-white/10">
                See how it works
              </a>
            </div>
            <p className="mt-5 text-xs text-sand/50">No setup fee. No credit card. Upgrade only when you're ready.</p>
          </div>
          <MiniCalculator />
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <p className="font-display text-5xl font-bold text-terracotta">500,000+</p>
            <p className="mt-2 text-sm text-muted">
              informal tradespeople in Kenya manage their business on paper, WhatsApp, or memory.
            </p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
            {[
              ["No cost tracking", "Fundis guess material costs and consistently undercharge."],
              ["No client channel", "There's no way for a new buyer to find a skilled fundi online."],
              ["No financial history", "No records means no access to loans or credit."],
              ["No sales record", "Disputes happen over what was agreed and delivered."],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="font-semibold text-bark">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-sand/40 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="font-display text-3xl font-bold text-bark text-center">Three tools. One habit.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              ["Public storefront", "A free profile with your trade, photos, and a one-tap WhatsApp button — this is what gets you found."],
              ["Cost calculator", "Add material, labour, and transport for any job and see your real profit instantly."],
              ["Client & job manager", "Job history, financial records, and client contacts — replacing paper and memory."],
            ].map(([t, b], i) => (
              <div key={t} className="card">
                <span className="h-10 w-10 rounded-full bg-terracotta/15 text-terracotta font-display font-bold flex items-center justify-center mb-4">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-bark">{t}</h3>
                <p className="mt-2 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display text-3xl font-bold text-bark text-center">Simple, honest pricing</h2>
        <p className="mt-2 text-center text-muted">Free to start. Pay only once the habit and the value are real.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6 items-center">
          <PricingCard name="Free" price="0" who="New fundis, trial users" features={["3 jobs / month", "Cost calculator", "Basic profit tool"]} />
          <PricingCard
            name="Pro"
            price="500"
            highlight
            who="Active fundis, 1–3 years experience"
            features={["Unlimited jobs", "Full job history", "Public storefront", "M-Pesa invoices"]}
          />
          <PricingCard name="Business" price="1,200" who="Established fundis, contractors" features={["Everything in Pro", "Client management", "SMS reminders", "Priority support"]} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-bark text-white">
        <div className="max-w-4xl mx-auto px-5 py-16 text-center">
          <h2 className="font-display text-3xl font-bold">Walk into the app the way you'd walk into a workshop.</h2>
          <p className="mt-3 text-sand/80">Free in under a minute. No bank account needed — just a phone number.</p>
          <Link to="/signup" className="btn-primary text-base px-8 py-3 mt-6 inline-block">Create your free account</Link>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted">
        FundiPro — Inua Fundi, Inua Kenya · Built by Andrew Wekesa, Kisii University
      </footer>
    </div>
  );
}
