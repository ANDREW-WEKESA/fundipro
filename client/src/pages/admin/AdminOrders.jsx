import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Spinner, EmptyState } from "../../components/ui";
import api from "../../lib/api";

const STATUS_COLORS = { requested:"bg-amber-50 text-amber-800", confirmed:"bg-blue-50 text-blue-800", partial:"bg-orange-50 text-orange-800", paid:"bg-green-50 text-green-800", ready_for_pickup:"bg-purple-50 text-purple-800", completed:"bg-gray-100 text-gray-600", cancelled:"bg-red-50 text-red-700" };

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [fundis, setFundis] = useState([]);

  useEffect(() => {
    api.get("/admin/orders").then(({ data }) => setOrders(data.orders)).catch(() => {});
    api.get("/admin/fundis").then(({ data }) => setFundis(data.fundis)).catch(() => {});
  }, []);

  const getFundiName = (id) => fundis.find((f) => f.id === id)?.name || "Unknown";

  return (
    <AdminLayout title="All Orders">
      {orders === null ? <Spinner/> : orders.length === 0 ? (
        <EmptyState icon="📋" title="No orders yet" body="Orders placed on any fundi's storefront will appear here."/>
      ) : (
        <div className="card !p-0 overflow-x-auto max-w-6xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-widest text-left" style={{color:"var(--muted)", borderColor:"var(--border)"}}>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Fundi</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Paid / Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0" style={{borderColor:"var(--border)"}}>
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate" style={{color:"var(--ink)"}}>{o.product_title}</td>
                  <td className="px-4 py-3" style={{color:"var(--muted)"}}>{getFundiName(o.fundi_id)}</td>
                  <td className="px-4 py-3" style={{color:"var(--muted)"}}>{o.customer_name}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold">{o.order_type}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold uppercase">{o.payment_type}</span></td>
                  <td className="px-4 py-3 text-right" style={{color:"var(--muted)"}}>KES {o.amount_paid.toLocaleString()} / {o.total_price.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                  <td className="px-4 py-3 text-xs" style={{color:"var(--muted)"}}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
