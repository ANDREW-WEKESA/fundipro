import { useEffect, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner, Banner, EmptyState, Modal } from "../../components/ui";
import api, { errMsg } from "../../lib/api";

const STATUS_LABELS = { requested:"Requested", confirmed:"Confirmed", partial:"Partially Paid", paid:"Fully Paid", ready_for_pickup:"Ready for Pickup", completed:"Completed", cancelled:"Cancelled" };
const STATUS_COLORS = { requested:"bg-amber-50 text-amber-800", confirmed:"bg-blue-50 text-blue-800", partial:"bg-orange-50 text-orange-800", paid:"bg-green-50 text-green-800", ready_for_pickup:"bg-purple-50 text-purple-800", completed:"bg-gray-100 text-gray-600", cancelled:"bg-red-50 text-red-700" };
const NEXT_STATUSES = { requested:["confirmed","cancelled"], confirmed:["partial","paid","cancelled"], partial:["paid","cancelled"], paid:["ready_for_pickup"], ready_for_pickup:["completed"] };

function OrderCard({ order, onUpdate }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const nextStatuses = NEXT_STATUSES[order.status] || [];
  const progressPct = order.total_price > 0 ? Math.round((order.amount_paid / order.total_price) * 100) : 0;

  async function addPayment() {
    if (!paymentAmount) return;
    setSaving(true);
    try { const { data } = await api.patch(`/orders/${order.id}`, { add_payment: Number(paymentAmount) }); onUpdate(data.order); setPaymentAmount(""); }
    catch(err) { alert(errMsg(err)); }
    finally { setSaving(false); }
  }

  async function moveStatus(status) {
    const { data } = await api.patch(`/orders/${order.id}`, { status });
    onUpdate(data.order);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold" style={{color:"var(--ink)"}}>{order.product_title}</p>
          <p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>
            {order.customer_name} · {order.customer_phone} · {new Date(order.created_at).toLocaleDateString()} · {order.order_type === "custom" ? "Custom build" : "Stock item"} · {order.payment_type.toUpperCase()}
          </p>
          {order.notes && <p className="text-xs mt-1 italic" style={{color:"var(--muted)"}}>{order.notes}</p>}
        </div>
        <span className={`text-xs font-bold rounded-full px-2.5 py-1 whitespace-nowrap shrink-0 ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
      </div>

      {/* Payment progress */}
      {order.total_price > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{color:"var(--muted)"}}>
            <span>KES {order.amount_paid.toLocaleString()} paid</span>
            <span>KES {order.total_price.toLocaleString()} total</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--bg)"}}>
            <div className="h-full rounded-full bg-good transition-all" style={{width:`${progressPct}%`}}/>
          </div>
        </div>
      )}

      {/* HP payment recording */}
      {order.payment_type === "hp" && !["completed","cancelled","paid"].includes(order.status) && (
        <div className="flex gap-2">
          <input className="input flex-1" type="number" min="0" placeholder="Record payment (KES)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}/>
          <button onClick={addPayment} disabled={saving} className="btn-primary shrink-0">Record</button>
        </div>
      )}

      {/* Status buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.map((s) => (
            <button key={s} onClick={() => moveStatus(s)}
              className={s === "cancelled" ? "btn-danger text-xs" : "btn-secondary text-xs"}>
              → {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ product_id:"", customer_name:"", customer_phone:"", payment_type:"cash", custom_description:"", total_price:"" });
  const [filter, setFilter] = useState("all");

  async function load() {
    const [ordRes, prodRes] = await Promise.all([api.get("/orders"), api.get("/storefront/me/items")]);
    setOrders(ordRes.data.orders);
    setProducts(prodRes.data.items);
  }
  useEffect(() => { load(); }, []);

  function updateOrder(updated) { setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o)); }

  async function createOrder(e) {
    e.preventDefault();
    const payload = { ...newForm, total_price: Number(newForm.total_price) || 0 };
    if (!newForm.product_id) { payload.order_type = "custom"; }
    const { data } = await api.post("/orders", payload);
    setOrders((p) => [data.order, ...(p||[])]);
    setShowNew(false);
    setNewForm({ product_id:"", customer_name:"", customer_phone:"", payment_type:"cash", custom_description:"", total_price:"" });
  }

  const filtered = filter === "all" ? orders : (orders||[]).filter((o) => o.status === filter);

  const tabs = [["all","All"], ["requested","New"], ["confirmed","Confirmed"], ["partial","Partially Paid"], ["paid","Paid"], ["completed","Completed"]];

  return (
    <FundiLayout title="Orders"
      headerRight={<button onClick={() => setShowNew(true)} className="btn-primary">+ New order</button>}>

      {showNew && (
        <Modal title="Place an order" onClose={() => setShowNew(false)}>
          <form onSubmit={createOrder} className="space-y-4">
            <div>
              <label className="label">Customer name *</label>
              <input className="input" value={newForm.customer_name} onChange={(e) => setNewForm((f) => ({...f,customer_name:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Customer phone</label>
              <input className="input" value={newForm.customer_phone} onChange={(e) => setNewForm((f) => ({...f,customer_phone:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Product (leave blank for custom)</label>
              <select className="input" value={newForm.product_id} onChange={(e) => setNewForm((f) => ({...f,product_id:e.target.value}))}>
                <option value="">— Custom build request —</option>
                {products.filter((p) => p.status === "available").map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — KES {p.cash_price.toLocaleString()} cash</option>
                ))}
              </select>
            </div>
            {!newForm.product_id && (
              <>
                <div>
                  <label className="label">Custom description</label>
                  <textarea className="input" rows={2} value={newForm.custom_description} onChange={(e) => setNewForm((f) => ({...f,custom_description:e.target.value}))}/>
                </div>
                <div>
                  <label className="label">Agreed price (KES)</label>
                  <input className="input" type="number" value={newForm.total_price} onChange={(e) => setNewForm((f) => ({...f,total_price:e.target.value}))}/>
                </div>
              </>
            )}
            <div>
              <label className="label">Payment type</label>
              <select className="input" value={newForm.payment_type} onChange={(e) => setNewForm((f) => ({...f,payment_type:e.target.value}))}>
                <option value="cash">Cash (pay in full)</option>
                <option value="hp">HP / Hire Purchase (installments)</option>
              </select>
            </div>
            <button className="btn-primary w-full">Place order</button>
          </form>
        </Modal>
      )}

      <div className="max-w-4xl space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${filter===val ? "bg-terracotta text-white" : "bg-sand/60 text-bark hover:bg-sand"}`}>
              {lbl}
            </button>
          ))}
        </div>

        {orders === null ? <Spinner/> : filtered?.length === 0 ? (
          <EmptyState icon="📋" title="No orders here" body="Orders from customers on your storefront will appear here."/>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => <OrderCard key={o.id} order={o} onUpdate={updateOrder}/>)}
          </div>
        )}
      </div>
    </FundiLayout>
  );
}
