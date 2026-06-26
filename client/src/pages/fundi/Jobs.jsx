import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FundiLayout from "./FundiLayout";
import { Spinner, Banner, EmptyState } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

const newExtra = () => ({ id: Date.now(), label: "", amount: "" });

export default function Jobs() {
  const { user, refreshMe } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [material, setMaterial] = useState("");
  const [labour, setLabour] = useState("");
  const [transport, setTransport] = useState("");
  const [extras, setExtras] = useState([]);
  const [calculated, setCalculated] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get("/jobs");
    setJobs(data.jobs);
  }
  useEffect(() => { load(); }, []);

  const totalCosts = useMemo(() => {
    const m = Number(material) || 0;
    const l = Number(labour) || 0;
    const t = Number(transport) || 0;
    const ex = extras.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    return m + l + t + ex;
  }, [material, labour, transport, extras]);

  function handleCalculate() {
    const s = Number(salePrice) || 0;
    const p = s - totalCosts;
    const margin = s > 0 ? Math.round((p / s) * 1000) / 10 : 0;
    setCalculated({ profit: p, margin, loss: p < 0 });
  }

  function addExtra() { setExtras((e) => [...e, newExtra()]); }
  function updateExtra(id, key, val) {
    setExtras((e) => e.map((x) => x.id === id ? { ...x, [key]: val } : x));
    setCalculated(null);
  }
  function removeExtra(id) { setExtras((e) => e.filter((x) => x.id !== id)); setCalculated(null); }

  async function submit(e) {
    e.preventDefault();
    if (!calculated) { setError("Click 'Calculate Profit' first to confirm the numbers."); return; }
    setError(""); setSaving(true);
    try {
      await api.post("/jobs", {
        title, client_name: clientName, sale_price: Number(salePrice),
        material_cost: Number(material), labour_cost: Number(labour), transport_cost: Number(transport),
        extra_costs: extras.filter((x) => x.label && x.amount).map((x) => ({ label: x.label, amount: Number(x.amount) })),
      });
      setTitle(""); setClientName(""); setSalePrice(""); setMaterial(""); setLabour(""); setTransport(""); setExtras([]); setCalculated(null);
      await load(); await refreshMe();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  }

  const atLimit = error?.toLowerCase().includes("limited");

  return (
    <FundiLayout title="Jobs & Cost Calculator">
      <div className="grid lg:grid-cols-5 gap-6 max-w-6xl">
        {/* Calculator panel */}
        <form onSubmit={submit} className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h2 className="section-title">New job</h2>
            {error && (
              <Banner kind={atLimit ? "warn" : "error"}>
                {error} {atLimit && <Link to="/app/billing" className="font-bold underline ml-1">Upgrade →</Link>}
              </Banner>
            )}
            <div>
              <label className="label">Job title</label>
              <input className="input" value={title} onChange={(e) => { setTitle(e.target.value); setCalculated(null); }} placeholder="e.g. Wooden bed frame" required/>
            </div>
            <div>
              <label className="label">Client name (optional)</label>
              <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)}/>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="section-title text-base">Cost breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              {[["Sale price (KES)", salePrice, setSalePrice], ["Material cost", material, setMaterial], ["Labour cost", labour, setLabour], ["Transport cost", transport, setTransport]].map(([lbl, val, setter]) => (
                <div key={lbl}>
                  <label className="label">{lbl}</label>
                  <input className="input" type="number" min="0" value={val} onChange={(e) => { setter(e.target.value); setCalculated(null); }}/>
                </div>
              ))}
            </div>

            {/* Extra cost lines */}
            {extras.map((ex) => (
              <div key={ex.id} className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Extra cost label" value={ex.label} onChange={(e) => updateExtra(ex.id, "label", e.target.value)}/>
                <input className="input w-28" type="number" min="0" placeholder="KES" value={ex.amount} onChange={(e) => updateExtra(ex.id, "amount", e.target.value)}/>
                <button type="button" onClick={() => removeExtra(ex.id)} className="text-muted hover:text-bad text-lg leading-none">✕</button>
              </div>
            ))}
            <button type="button" onClick={addExtra} className="btn-ghost text-sm w-full border border-dashed" style={{borderColor:"var(--border)"}}>+ Add extra cost</button>

            {/* Calculate button */}
            <button type="button" onClick={handleCalculate}
              className="btn-dark w-full text-base py-3">
              🧮 Calculate Profit
            </button>

            {/* Result */}
            {calculated && (
              <div className={`rounded-xl px-5 py-4 transition-all ${calculated.loss ? "bg-bad/10 border border-bad/20" : "bg-good/10 border border-good/20"}`}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color:"var(--muted)"}}>
                  {calculated.loss ? "⚠️ LOSS on this job" : "✅ Profit on this job"}
                </p>
                <p className={`font-display text-3xl font-bold mt-1 ${calculated.loss ? "text-bad" : "text-good"}`}>
                  KES {calculated.profit.toLocaleString()}
                </p>
                <p className="text-sm mt-1 font-semibold" style={{color:"var(--muted)"}}>{calculated.margin}% margin</p>
                {calculated.loss && (
                  <p className="text-xs mt-2 text-bad">
                    You are spending KES {Math.abs(calculated.profit).toLocaleString()} more than you are charging. Raise your price or reduce costs.
                  </p>
                )}
              </div>
            )}

            <button className="btn-primary w-full py-3" disabled={saving || !calculated}>
              {saving ? "Saving…" : "Save job to history"}
            </button>
          </div>
        </form>

        {/* Job history */}
        <div className="lg:col-span-3">
          <h2 className="section-title mb-4">Job history</h2>
          {jobs === null ? <Spinner/> : jobs.length === 0 ? (
            <EmptyState icon="🧮" title="No jobs yet" body="Add your first job to see your real profit — not a guess."/>
          ) : (
            <div className="space-y-3">
              {jobs.map((j) => (
                <div key={j.id} className="card flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{color:"var(--ink)"}}>{j.title}</p>
                    <p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>
                      {j.client_name ? `${j.client_name} · ` : ""}{new Date(j.created_at).toLocaleDateString()} · sold KES {j.sale_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-display font-bold ${j.profit >= 0 ? "text-good" : "text-bad"}`}>KES {j.profit.toLocaleString()}</p>
                    <p className="text-xs" style={{color:"var(--muted)"}}>{j.margin_pct}% margin</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FundiLayout>
  );
}
