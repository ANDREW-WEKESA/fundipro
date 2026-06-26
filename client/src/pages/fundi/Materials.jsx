import { useEffect, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner, EmptyState, Banner, Modal } from "../../components/ui";
import api, { errMsg } from "../../lib/api";

function MaterialRow({ mat, onRestock, onUse, onDelete }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState(null); // null | "restock" | "use"
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState(null);

  async function commit() {
    if (!amount) return;
    setSaving(true); setNotify(null);
    try {
      const fn = mode === "restock" ? onRestock : onUse;
      const msg = await fn(mat.id, Number(amount), reason);
      if (msg) setNotify(msg);
      setAmount(""); setReason(""); setMode(null);
    } catch(err) { alert(errMsg(err)); }
    finally { setSaving(false); }
  }

  const pct = mat.low_stock_threshold > 0 ? Math.min(Math.round((mat.quantity / Math.max(mat.quantity, mat.low_stock_threshold * 3)) * 100), 100) : 100;

  return (
    <div className={`card space-y-3 ${mat.low_stock ? "low-stock-pulse" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold" style={{color:"var(--ink)"}}>{mat.name}</p>
            {mat.low_stock && <span className="text-[10px] font-bold rounded-full bg-bad text-white px-2 py-0.5">LOW STOCK</span>}
          </div>
          <p className="text-sm mt-0.5" style={{color:"var(--muted)"}}>{mat.quantity} {mat.unit} remaining</p>
        </div>
        <button onClick={() => onDelete(mat.id)} className="text-muted hover:text-bad text-lg">✕</button>
      </div>

      {/* Stock level bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--bg)"}}>
        <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background: mat.low_stock ? "#9E3B3B" : "#4B7F52"}}/>
      </div>

      {notify && <Banner kind="warn">{notify}</Banner>}

      {mode ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className="input flex-1" type="number" min="0.01" step="0.01" placeholder={`Amount (${mat.unit})`} value={amount} onChange={(e) => setAmount(e.target.value)}/>
            <input className="input flex-1" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}/>
          </div>
          <div className="flex gap-2">
            <button onClick={commit} disabled={saving} className={mode === "restock" ? "btn-primary flex-1" : "btn-danger flex-1"}>
              {saving ? "Saving…" : mode === "restock" ? "Confirm restock" : "Confirm use"}
            </button>
            <button onClick={() => { setMode(null); setAmount(""); setReason(""); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setMode("restock")} className="btn-primary flex-1 text-sm">+ Restock</button>
          <button onClick={() => setMode("use")} className="btn-secondary flex-1 text-sm">− Used on job</button>
        </div>
      )}
    </div>
  );
}

export default function Materials() {
  const [materials, setMaterials] = useState(null);
  const [lowCount, setLowCount] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", quantity:"", unit:"pcs", low_stock_threshold:"5" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/materials");
    setMaterials(data.materials);
    setLowCount(data.low_stock_count);
  }
  useEffect(() => { load(); }, []);

  async function handleRestock(id, amount, reason) {
    const { data } = await api.patch(`/materials/${id}/restock`, { amount, reason });
    setMaterials((prev) => prev.map((m) => m.id === id ? data.material : m));
  }

  async function handleUse(id, amount, reason) {
    const { data } = await api.patch(`/materials/${id}/use`, { amount, reason });
    setMaterials((prev) => prev.map((m) => m.id === id ? data.material : m));
    return data.notify;
  }

  async function handleDelete(id) {
    if (!confirm("Remove this material from your store?")) return;
    await api.delete(`/materials/${id}`);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  async function addMaterial(e) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const { data } = await api.post("/materials", { ...form, quantity: Number(form.quantity), low_stock_threshold: Number(form.low_stock_threshold) });
      setMaterials((prev) => [...(prev||[]), data.material]);
      setForm({ name:"", quantity:"", unit:"pcs", low_stock_threshold:"5" });
      setShowAdd(false);
    } catch(err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  }

  return (
    <FundiLayout title="Tools & Materials"
      headerRight={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add material</button>}>

      {showAdd && (
        <Modal title="Add a material or tool" onClose={() => setShowAdd(false)}>
          <form onSubmit={addMaterial} className="space-y-4">
            {error && <Banner kind="error">{error}</Banner>}
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} placeholder="e.g. Mahogany timber (4x2)" required/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => ({...f,quantity:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input" value={form.unit} onChange={(e) => setForm((f) => ({...f,unit:e.target.value}))} placeholder="pcs / metres / litres"/>
              </div>
            </div>
            <div>
              <label className="label">Low stock alert at</label>
              <input className="input" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({...f,low_stock_threshold:e.target.value}))}/>
            </div>
            <button className="btn-primary w-full" disabled={saving}>{saving ? "Adding…" : "Add material"}</button>
          </form>
        </Modal>
      )}

      <div className="max-w-5xl space-y-5">
        {lowCount > 0 && (
          <Banner kind="warn">⚠️ {lowCount} {lowCount === 1 ? "material is" : "materials are"} below the low-stock threshold. Restock before your next job.</Banner>
        )}
        {materials === null ? <Spinner/> : materials.length === 0 ? (
          <EmptyState icon="📦" title="Tools & materials store is empty"
            body="Track your timber, fabric, welding rods, or any material. You'll get an alert when stock runs low."
            action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add your first material</button>}/>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <MaterialRow key={m.id} mat={m} onRestock={handleRestock} onUse={handleUse} onDelete={handleDelete}/>
            ))}
          </div>
        )}
      </div>
    </FundiLayout>
  );
}
