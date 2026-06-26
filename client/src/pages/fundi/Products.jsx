import { useEffect, useRef, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner, Banner, EmptyState, StatusPill, Modal } from "../../components/ui";
import api, { errMsg } from "../../lib/api";

const STATUS_NEXT = { in_progress:"available", available:"reserved", reserved:"sold", sold:"in_progress" };
const MAX_PHOTOS = 4;

function PhotoGrid({ photos, onRemove, editable }) {
  const [lightbox, setLightbox] = useState(null);
  return (
    <>
      <div className={`grid gap-2 ${photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {photos.map((p, i) => (
          <div key={i} className="photo-thumb aspect-square" onClick={() => setLightbox(p)}>
            <img src={p} alt={`photo ${i+1}`}/>
            {editable && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-bad text-white text-xs font-bold flex items-center justify-center shadow">✕</button>
            )}
          </div>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-bark/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"/>
        </div>
      )}
    </>
  );
}

function ProductCard({ item, onStatusChange, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: item.title, description: item.description, cash_price: item.cash_price, hp_price: item.hp_price, photos: item.photos || [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  function addPhotos(files) {
    const remaining = MAX_PHOTOS - form.photos.length;
    if (remaining <= 0) return;
    Array.from(files).slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setForm((f) => ({ ...f, photos: [...f.photos, e.target.result] }));
      reader.readAsDataURL(file);
    });
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const updated = await onSave(item.id, { ...form, cash_price: Number(form.cash_price), hp_price: Number(form.hp_price) });
      setEditing(false);
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  }

  const statusColors = { in_progress:"text-amber-700 bg-amber-50", available:"text-green-700 bg-green-50", reserved:"text-blue-700 bg-blue-50", sold:"text-gray-600 bg-gray-100" };
  const statusLabels = { in_progress:"In Progress", available:"Available", reserved:"Reserved", sold:"Sold" };

  return (
    <div className="card space-y-3">
      {/* Photos */}
      <PhotoGrid photos={editing ? form.photos : (item.photos || [])} editable={editing}
        onRemove={(i) => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}/>

      {editing && form.photos.length < MAX_PHOTOS && (
        <>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl py-3 text-sm font-medium text-muted hover:border-terracotta hover:text-terracotta transition-colors">
            📷 Add photo ({form.photos.length}/{MAX_PHOTOS})
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => addPhotos(e.target.files)}/>
        </>
      )}
      {!editing && (item.photos || []).length === 0 && (
        <div className="h-24 rounded-xl flex items-center justify-center text-sm text-muted" style={{background:"var(--bg)"}}>No photos yet</div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold rounded-full px-3 py-1 ${statusColors[item.status]}`}>
          {item.status === "in_progress" ? "🔨 In Progress — not yet done" : statusLabels[item.status]}
        </span>
        <button onClick={() => onStatusChange(item.id, STATUS_NEXT[item.status])}
          className="text-xs text-muted hover:text-terracotta underline">
          Mark as {statusLabels[STATUS_NEXT[item.status]]}
        </button>
      </div>

      {/* Fields */}
      {editing ? (
        <div className="space-y-2.5">
          {error && <Banner kind="error">{error}</Banner>}
          <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title"/>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description"/>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Cash price (KES)</label>
              <input className="input" type="number" value={form.cash_price} onChange={(e) => setForm((f) => ({ ...f, cash_price: e.target.value }))}/>
            </div>
            <div>
              <label className="label">HP price (KES) ↑</label>
              <input className="input" type="number" value={form.hp_price} onChange={(e) => setForm((f) => ({ ...f, hp_price: e.target.value }))}/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : "Save"}</button>
            <button onClick={() => { setEditing(false); setForm({ title: item.title, description: item.description, cash_price: item.cash_price, hp_price: item.hp_price, photos: item.photos || [] }); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-semibold" style={{color:"var(--ink)"}}>{item.title}</p>
          {item.description && <p className="text-sm mt-0.5" style={{color:"var(--muted)"}}>{item.description}</p>}
          {(item.cash_price > 0 || item.hp_price > 0) && (
            <div className="flex gap-4 mt-2 text-sm">
              {item.cash_price > 0 && <span className="font-bold text-terracotta">KES {item.cash_price.toLocaleString()} cash</span>}
              {item.hp_price > 0 && <span className="text-muted">KES {item.hp_price.toLocaleString()} HP</span>}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs">✏️ Edit</button>
            <button onClick={() => onDelete(item.id)} className="btn-danger text-xs">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title:"", description:"", cash_price:"", hp_price:"", status:"in_progress", photos:[] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function addPhotos(files) {
    const remaining = MAX_PHOTOS - form.photos.length;
    Array.from(files).slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setForm((f) => ({ ...f, photos: [...f.photos, e.target.result] }));
      reader.readAsDataURL(file);
    });
  }

  async function submit(e) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const { data } = await api.post("/storefront/me/items", { ...form, cash_price: Number(form.cash_price), hp_price: Number(form.hp_price) });
      onAdded(data.item); onClose();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add a new product" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Banner kind="error">{error}</Banner>}
        <div>
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required/>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cash price (KES)</label>
            <input className="input" type="number" value={form.cash_price} onChange={(e) => setForm((f) => ({ ...f, cash_price: e.target.value }))}/>
          </div>
          <div>
            <label className="label">HP price (KES)</label>
            <input className="input" type="number" value={form.hp_price} onChange={(e) => setForm((f) => ({ ...f, hp_price: e.target.value }))}/>
          </div>
        </div>
        <div>
          <label className="label">Initial status</label>
          <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="in_progress">In Progress (still building)</option>
            <option value="available">Available (ready to order)</option>
          </select>
        </div>
        {/* Photos */}
        <div>
          <label className="label">Photos (up to {MAX_PHOTOS})</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {form.photos.map((p, i) => (
              <div key={i} className="photo-thumb aspect-square">
                <img src={p} alt=""/>
                <button type="button" onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-bad text-white text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
          {form.photos.length < MAX_PHOTOS && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed rounded-xl py-2.5 text-sm text-muted hover:border-terracotta hover:text-terracotta transition-colors">
                📷 Upload photos ({form.photos.length}/{MAX_PHOTOS})
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => addPhotos(e.target.files)}/>
            </>
          )}
        </div>
        <button className="btn-primary w-full" disabled={saving}>{saving ? "Adding…" : "Add product"}</button>
      </form>
    </Modal>
  );
}

export default function Products() {
  const [items, setItems] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const { data } = await api.get("/storefront/me/items");
    setItems(data.items);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(id, patch) {
    const { data } = await api.patch(`/storefront/me/items/${id}`, patch);
    setItems((prev) => prev.map((i) => i.id === id ? data.item : i));
  }

  async function handleStatus(id, status) {
    const { data } = await api.patch(`/storefront/me/items/${id}/status`, { status });
    setItems((prev) => prev.map((i) => i.id === id ? data.item : i));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/storefront/me/items/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <FundiLayout title="My Products"
      headerRight={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add product</button>}>
      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdded={(item) => { setItems((p) => [item, ...(p||[])]); setShowAdd(false); }}/>}
      <div className="max-w-5xl">
        {items === null ? <Spinner/> : items.length === 0 ? (
          <EmptyState icon="🛠️" title="No products yet"
            body="Add your first product — it appears on your storefront immediately, marked as In Progress until it's done."
            action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add your first product</button>}/>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ProductCard key={item.id} item={item}
                onStatusChange={handleStatus} onSave={handleSave} onDelete={handleDelete}/>
            ))}
          </div>
        )}
      </div>
    </FundiLayout>
  );
}
