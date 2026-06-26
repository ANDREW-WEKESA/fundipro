import { useEffect, useRef, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Banner, Spinner, EmptyState } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

const MAX_PHOTOS = 4;
const STATUS_LABEL = { in_progress: "In progress", available: "Available", reserved: "Reserved", sold: "Sold" };
const STATUS_COLOR = {
  in_progress: "bg-terracotta/15 text-terracotta-dark",
  available: "bg-good/15 text-good",
  reserved: "bg-sand text-bark dark:bg-white/10 dark:text-sand",
  sold: "bg-bark text-white dark:bg-white/20",
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProductCard({ item, onChanged, onDeleted }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ title: item.title, description: item.description, cash_price: item.cash_price, hp_price: item.hp_price });

  async function handlePhotos(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - item.photos.length);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      const { data } = await api.patch(`/storefront/me/items/${item.id}`, { photos: [...item.photos, ...dataUrls] });
      onChanged(data.item);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto(idx) {
    const photos = item.photos.filter((_, i) => i !== idx);
    const { data } = await api.patch(`/storefront/me/items/${item.id}`, { photos });
    onChanged(data.item);
  }

  async function saveDetails(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch(`/storefront/me/items/${item.id}`, form);
      onChanged(data.item);
      setEdit(false);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    setBusy(true);
    try {
      const { data } = await api.patch(`/storefront/me/items/${item.id}/status`, { status });
      onChanged(data.item);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {edit ? (
            <input className="input !text-sm mb-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          ) : (
            <p className="font-semibold text-bark dark:text-sand truncate">{item.title}</p>
          )}
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mt-1 ${STATUS_COLOR[item.status]}`}>
            {STATUS_LABEL[item.status]}
          </span>
        </div>
        <button onClick={() => onDeleted(item.id)} className="text-muted hover:text-bad text-sm shrink-0">✕</button>
      </div>

      {/* Photo grid — up to 4 */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {item.photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-bark/10 dark:border-white/10">
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-bark/70 text-white text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        {item.photos.length < MAX_PHOTOS && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-bark/20 dark:border-white/20 flex items-center justify-center text-xs text-muted dark:text-sand/40 cursor-pointer hover:border-terracotta">
            {busy ? "…" : `+ Photo (${item.photos.length}/${MAX_PHOTOS})`}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} disabled={busy} />
          </label>
        )}
      </div>

      {edit ? (
        <form onSubmit={saveDetails} className="mt-3 space-y-2">
          <textarea className="input !text-sm" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label !mb-1">Cash price</label>
              <input className="input !text-sm" type="number" value={form.cash_price} onChange={(e) => setForm((f) => ({ ...f, cash_price: e.target.value }))} />
            </div>
            <div>
              <label className="label !mb-1">Hire purchase price</label>
              <input className="input !text-sm" type="number" value={form.hp_price} onChange={(e) => setForm((f) => ({ ...f, hp_price: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary !text-xs !py-1.5" disabled={busy}>Save</button>
            <button type="button" className="btn-secondary !text-xs !py-1.5" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {item.description && <p className="text-xs text-muted dark:text-sand/50 mt-2">{item.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-semibold text-terracotta">Cash: KES {item.cash_price.toLocaleString()}</span>
            <span className="text-muted dark:text-sand/50">HP: KES {item.hp_price.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setEdit(true)} className="btn-secondary !text-xs !py-1.5">Edit details</button>
            {item.status === "in_progress" && (
              <button onClick={() => setStatus("available")} disabled={busy} className="btn-primary !text-xs !py-1.5">Mark as finished</button>
            )}
            {item.status === "available" && (
              <button onClick={() => setStatus("in_progress")} disabled={busy} className="btn-secondary !text-xs !py-1.5">Mark as in progress</button>
            )}
            {item.status === "reserved" && (
              <button onClick={() => setStatus("available")} disabled={busy} className="btn-secondary !text-xs !py-1.5">Release reservation</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function StorefrontEditor() {
  const { user, tierConfig, refreshMe } = useAuth();
  const [profile, setProfile] = useState({ bio: "", trade: "", location: "", whatsapp: "" });
  const [items, setItems] = useState(null);
  const [newItem, setNewItem] = useState({ title: "", description: "", cash_price: "", hp_price: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({ bio: user.bio || "", trade: user.trade || "", location: user.location || "", whatsapp: user.whatsapp || "" });
    }
    api.get("/storefront/me/items").then(({ data }) => setItems(data.items));
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setSavedMsg("");
    try {
      await api.patch("/storefront/me/profile", profile);
      await refreshMe();
      setSavedMsg("Storefront updated.");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function addItem(e) {
    e.preventDefault();
    if (!newItem.title) return;
    const { data } = await api.post("/storefront/me/items", newItem);
    setItems((prev) => [data.item, ...prev]);
    setNewItem({ title: "", description: "", cash_price: "", hp_price: "" });
  }

  function updateItem(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function removeItem(id) {
    await api.delete(`/storefront/me/items/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const isPublic = tierConfig?.storefrontPublic;
  const publicUrl = `${window.location.origin}/s/${user?.slug}`;

  return (
    <FundiLayout title="Your Storefront">
      <div className="space-y-6 max-w-3xl">
        <Banner kind={isPublic ? "success" : "warn"}>
          {isPublic ? (
            <>
              Your storefront is live and verified — share it anywhere (WhatsApp, Facebook, Instagram):{" "}
              <a href={`/s/${user.slug}`} target="_blank" rel="noreferrer" className="font-semibold underline">
                {publicUrl}
              </a>
            </>
          ) : (
            <>You're building your storefront, but it isn't publicly verified yet — upgrade to Pro to make it live and shareable.</>
          )}
        </Banner>

        <form onSubmit={saveProfile} className="card space-y-4">
          <h2 className="font-display font-bold text-bark dark:text-sand">Profile</h2>
          {error && <Banner kind="error">{error}</Banner>}
          {savedMsg && <Banner kind="success">{savedMsg}</Banner>}
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell potential clients what you do best." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Trade</label>
              <input className="input" value={profile.trade} onChange={(e) => setProfile((p) => ({ ...p, trade: e.target.value }))} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">WhatsApp number</label>
            <input className="input" value={profile.whatsapp} onChange={(e) => setProfile((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="07XXXXXXXX" />
          </div>
          <button className="btn-primary">Save changes</button>
        </form>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-display font-bold text-bark dark:text-sand mb-1">Add a product</h2>
            <p className="text-xs text-muted dark:text-sand/50 mb-3">
              New products show up on your storefront right away, marked "in progress" until you mark them finished.
              Add up to {MAX_PHOTOS} photos per product once it's created, so customers see every angle.
            </p>
            <form onSubmit={addItem} className="space-y-2.5">
              <input className="input" placeholder="Product title" value={newItem.title} onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))} required />
              <input className="input" placeholder="Description (optional)" value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2.5">
                <input className="input" type="number" placeholder="Cash price (KES)" value={newItem.cash_price} onChange={(e) => setNewItem((p) => ({ ...p, cash_price: e.target.value }))} />
                <input className="input" type="number" placeholder="Hire purchase price (KES)" value={newItem.hp_price} onChange={(e) => setNewItem((p) => ({ ...p, hp_price: e.target.value }))} />
              </div>
              <p className="text-[11px] text-muted dark:text-sand/40">HP price is usually a little higher than cash, to cover the cost of waiting for full payment.</p>
              <button className="btn-secondary w-full">Add product</button>
            </form>
          </div>

          {items === null ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState icon="🛠️" title="No products yet" body="Add a piece of work or a product so buyers know what you make." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((it) => (
                <ProductCard key={it.id} item={it} onChanged={updateItem} onDeleted={removeItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </FundiLayout>
  );
}
