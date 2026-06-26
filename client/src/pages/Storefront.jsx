import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import { Spinner, Banner, Modal, StatusPill } from "../components/ui";
import api, { errMsg } from "../lib/api";

function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return <span className="text-terracotta">{"★".repeat(full)}<span className="opacity-20">{"★".repeat(5-full)}</span></span>;
}

function PhotoCarousel({ photos, title }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!photos || photos.length === 0) return (
    <div className="aspect-video rounded-2xl flex items-center justify-center text-sm" style={{background:"var(--bg)", color:"var(--muted)"}}>No photos yet</div>
  );
  return (
    <>
      <div className="relative rounded-2xl overflow-hidden aspect-video cursor-pointer" onClick={() => setLightbox(true)}>
        <img src={photos[idx]} alt={title} className="w-full h-full object-cover transition-all duration-300"/>
        {photos.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i-1+photos.length)%photos.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-bark/70 text-white flex items-center justify-center">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i+1)%photos.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-bark/70 text-white flex items-center justify-center">›</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_,i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i===idx?"bg-white":"bg-white/40"}`}/>)}
            </div>
          </>
        )}
        <div className="absolute top-2 right-2 bg-bark/60 text-white text-xs px-2 py-0.5 rounded-full">🔍 Tap to zoom</div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-bark/95 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={photos[idx]} className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"/>
        </div>
      )}
    </>
  );
}

function OrderModal({ product, fundi, onClose }) {
  const [form, setForm] = useState({ customer_name:"", customer_phone:"", payment_type:"cash", order_type: product ? "stock" : "custom", custom_description:"" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const price = product ? (form.payment_type === "hp" ? product.hp_price : product.cash_price) : 0;

  async function submit(e) {
    e.preventDefault(); setError(""); setSending(true);
    try {
      await api.post(`/storefront/${fundi.slug}/orders`, {
        ...form,
        product_id: product?.id || null,
      });
      setSubmitted(true);
    } catch(err) { setError(errMsg(err)); }
    finally { setSending(false); }
  }

  if (submitted) return (
    <Modal title="Order sent!" onClose={onClose}>
      <div className="text-center py-6 space-y-4">
        <div className="text-5xl">✅</div>
        <p className="font-semibold" style={{color:"var(--ink)"}}>Your order is with {fundi.name}</p>
        <p className="text-sm" style={{color:"var(--muted)"}}>They'll confirm and contact you directly on WhatsApp or phone. The product stays reserved for you until confirmed.</p>
        <button onClick={onClose} className="btn-primary w-full">Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title={product ? `Order: ${product.title}` : "Request a custom build"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Banner kind="error">{error}</Banner>}
        <div><label className="label">Your name *</label><input className="input" value={form.customer_name} onChange={(e) => setForm((f) => ({...f,customer_name:e.target.value}))} required/></div>
        <div><label className="label">Your phone number *</label><input className="input" value={form.customer_phone} onChange={(e) => setForm((f) => ({...f,customer_phone:e.target.value}))} placeholder="07XXXXXXXX" required/></div>
        {!product && (
          <div><label className="label">Describe what you want built</label>
            <textarea className="input" rows={3} value={form.custom_description} onChange={(e) => setForm((f) => ({...f,custom_description:e.target.value}))} placeholder="e.g. I saw the mahogany dining table on your profile. Can you make me one in a slightly smaller size?"/>
          </div>
        )}
        {product && (
          <div>
            <label className="label">Payment method</label>
            <div className="grid grid-cols-2 gap-3">
              {[["cash","Cash — KES "+product.cash_price.toLocaleString()], ["hp","HP (installments) — KES "+product.hp_price.toLocaleString()]].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setForm((f) => ({...f,payment_type:val}))}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all ${form.payment_type===val?"border-terracotta bg-terracotta/5 text-terracotta-dark":"border-transparent"}`}
                  style={{borderColor: form.payment_type===val ? undefined : "var(--border)", background: form.payment_type===val ? undefined : "var(--card)"}}>
                  {label}
                  {val==="hp" && <span className="block text-[10px] font-normal mt-0.5" style={{color:"var(--muted)"}}>Pay in installments, pick up after full payment</span>}
                </button>
              ))}
            </div>
            {price > 0 && <p className="text-sm font-semibold text-terracotta mt-2">Total: KES {price.toLocaleString()}</p>}
          </div>
        )}
        <button className="btn-primary w-full py-3" disabled={sending}>{sending ? "Sending…" : "Place order"}</button>
        <p className="text-xs text-center" style={{color:"var(--muted)"}}>No payment now — {fundi.name} will confirm and arrange payment directly with you.</p>
      </form>
    </Modal>
  );
}

export default function Storefront() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [orderProduct, setOrderProduct] = useState(undefined); // undefined=closed, null=custom, product=stock
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  async function load() {
    try { const { data } = await api.get(`/storefront/${slug}`); setData(data); }
    catch(err) { setError(errMsg(err, "This storefront could not be found.")); }
  }
  useEffect(() => { load(); }, [slug]);

  async function submitReview(e) {
    e.preventDefault();
    await api.post(`/storefront/${slug}/reviews`, { reviewer_name: reviewName, rating: reviewRating, comment: reviewComment });
    setReviewSent(true); load();
  }

  if (error) return <div><PublicNavbar/><div className="max-w-lg mx-auto px-5 py-20 text-center"><h1 className="font-display text-2xl font-bold" style={{color:"var(--ink)"}}>Storefront not found</h1><p className="mt-2" style={{color:"var(--muted)"}}>{error}</p></div></div>;
  if (!data) return <div><PublicNavbar/><Spinner/></div>;

  const { profile, items, reviews, avg_rating } = data;
  const waLink = profile.whatsapp ? `https://wa.me/254${profile.whatsapp.replace(/^0/,"")}` : null;

  const inProgress = items.filter((i) => i.status === "in_progress");
  const available = items.filter((i) => i.status === "available");
  const past = items.filter((i) => ["reserved","sold"].includes(i.status));

  return (
    <div style={{background:"var(--bg)", minHeight:"100vh"}}>
      <PublicNavbar/>

      {orderProduct !== undefined && (
        <OrderModal product={orderProduct} fundi={profile} onClose={() => setOrderProduct(undefined)}/>
      )}

      {/* Hero */}
      <section className="bg-bark text-white">
        <div className="max-w-4xl mx-auto px-5 py-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-terracotta flex items-center justify-center font-display text-3xl font-bold shrink-0">{profile.name?.[0]||"F"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
              {profile.verified && <span className="text-[11px] font-bold uppercase tracking-wide bg-terracotta px-2.5 py-1 rounded-full">Verified Pro</span>}
            </div>
            <p className="text-sand/80 mt-1">{profile.trade} · {profile.location}</p>
            {avg_rating && <div className="mt-1.5 flex items-center gap-1.5 text-sm"><Stars rating={avg_rating}/> <span className="text-sand/70">{avg_rating} ({reviews.length} reviews)</span></div>}
            {profile.bio && <p className="text-sand/80 text-sm mt-2 max-w-lg">{profile.bio}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary whitespace-nowrap">💬 WhatsApp {profile.name?.split(" ")[0]}</a>}
            <button onClick={() => setOrderProduct(null)} className="btn-secondary !bg-white/10 !border-white/20 !text-white whitespace-nowrap">🔨 Request custom build</button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10 space-y-10">
        {/* Available products */}
        {available.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4" style={{color:"var(--ink)"}}>Available now — order today</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {available.map((item) => (
                <div key={item.id} className="card space-y-3">
                  <PhotoCarousel photos={item.photos} title={item.title}/>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{color:"var(--ink)"}}>{item.title}</p>
                      {item.description && <p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>{item.description}</p>}
                      <div className="flex gap-3 mt-2 text-sm flex-wrap">
                        {item.cash_price > 0 && <span className="font-bold text-terracotta">KES {item.cash_price.toLocaleString()} cash</span>}
                        {item.hp_price > 0 && <span style={{color:"var(--muted)"}}>KES {item.hp_price.toLocaleString()} HP</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setOrderProduct(item)} className="btn-primary w-full">Order this item</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-1" style={{color:"var(--ink)"}}>Coming soon 🔨</h2>
            <p className="text-sm mb-4" style={{color:"var(--muted)"}}>These items are still being built. You can request one like them.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {inProgress.map((item) => (
                <div key={item.id} className="card opacity-80 space-y-3">
                  <PhotoCarousel photos={item.photos} title={item.title}/>
                  <p className="font-semibold" style={{color:"var(--ink)"}}>{item.title}</p>
                  {item.description && <p className="text-xs" style={{color:"var(--muted)"}}>{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <StatusPill status="in_progress"/>
                    <button onClick={() => setOrderProduct(null)} className="btn-secondary text-xs">Request similar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past work / history */}
        {past.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-1" style={{color:"var(--ink)"}}>Product history</h2>
            <p className="text-sm mb-4" style={{color:"var(--muted)"}}>These have been sold or reserved — request something similar anytime.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {past.map((item) => (
                <div key={item.id} className="card space-y-2">
                  <PhotoCarousel photos={item.photos} title={item.title}/>
                  <p className="font-semibold text-sm" style={{color:"var(--ink)"}}>{item.title}</p>
                  <div className="flex items-center justify-between">
                    <StatusPill status={item.status}/>
                    <button onClick={() => setOrderProduct(null)} className="text-xs text-terracotta underline">Order similar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && <p className="text-center py-10" style={{color:"var(--muted)"}}>No products posted yet — check back soon.</p>}

        {/* Reviews */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4" style={{color:"var(--ink)"}}>Client reviews</h2>
          <div className="space-y-3 mb-6">
            {reviews.length === 0 && <p className="text-sm" style={{color:"var(--muted)"}}>No reviews yet. Be the first.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm" style={{color:"var(--ink)"}}>{r.reviewer_name}</p>
                  <Stars rating={r.rating}/>
                </div>
                {r.comment && <p className="text-sm mt-1.5" style={{color:"var(--muted)"}}>{r.comment}</p>}
              </div>
            ))}
          </div>
          {!reviewSent ? (
            <form onSubmit={submitReview} className="card space-y-3">
              <h3 className="font-semibold" style={{color:"var(--ink)"}}>Leave a review</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="label">Your name</label><input className="input" value={reviewName} onChange={(e) => setReviewName(e.target.value)} required/></div>
                <div><label className="label">Rating</label>
                  <select className="input" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                    {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Comment</label><textarea className="input" rows={2} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}/></div>
              <button className="btn-primary">Post review</button>
            </form>
          ) : <Banner kind="success">Thanks for the review — it now shows on this storefront.</Banner>}
        </section>

        {/* Viral CTA */}
        <div className="card text-center">
          <p className="text-sm" style={{color:"var(--muted)"}}>Want a free storefront like this for your own trade?</p>
          <a href="/signup" className="btn-primary mt-3 inline-block">Create yours free on FundiPro →</a>
          <p className="text-xs mt-2" style={{color:"var(--muted)"}}>Share your link on WhatsApp, Facebook, or anywhere your clients are.</p>
        </div>
      </div>
    </div>
  );
}
