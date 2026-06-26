import { useEffect, useState, useRef } from "react";
import FundiLayout from "./FundiLayout";
import { Banner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const PLANS = [
  { id: "free", label: "Free", price: 0, features: ["3 jobs / month", "Cost calculator", "Basic profit tool"] },
  { id: "pro", label: "Pro", price: 500, features: ["Unlimited jobs", "Full job history", "Public storefront", "M-Pesa invoices"] },
  { id: "business", label: "Business", price: 1200, features: ["Everything in Pro", "Client management", "SMS reminders", "Priority support"] },
];

function StkModal({ tier, onClose, onSuccess }) {
  const [status, setStatus] = useState("sending"); // sending -> pending -> success/failed
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    let poll;
    api.post("/payments/stk-push", { tier }).then(({ data }) => {
      setStatus("pending");
      poll = setInterval(async () => {
        const { data: s } = await api.get(`/payments/${data.payment.id}/status`);
        if (s.payment.status !== "pending") {
          clearInterval(poll);
          setStatus(s.payment.status);
          if (s.payment.status === "success") onSuccess();
        }
      }, 1200);
    });
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  return (
    <div className="fixed inset-0 bg-bark/60 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full text-center shadow-card">
        {status !== "success" && status !== "failed" && (
          <>
            <span className="h-10 w-10 mx-auto rounded-full border-2 border-terracotta border-t-transparent animate-spin block mb-4" />
            <h3 className="font-display font-bold text-bark">Check your phone</h3>
            <p className="text-sm text-muted mt-2">
              We sent an M-Pesa STK push to your phone for KES {PLANS.find((p) => p.id === tier)?.price}. Enter your PIN to confirm.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-display font-bold text-good">Payment confirmed</h3>
            <p className="text-sm text-muted mt-2">You're now on the {PLANS.find((p) => p.id === tier)?.label} plan.</p>
            <button className="btn-primary mt-5 w-full" onClick={onClose}>Done</button>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-display font-bold text-bad">Payment didn't go through</h3>
            <p className="text-sm text-muted mt-2">This can happen with a wrong PIN or low balance. You can try again any time.</p>
            <button className="btn-secondary mt-5 w-full" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Billing() {
  const { user, refreshMe } = useAuth();
  const [modalTier, setModalTier] = useState(null);
  const [payments, setPayments] = useState([]);

  function loadPayments() {
    api.get("/payments").then(({ data }) => setPayments(data.payments));
  }
  useEffect(loadPayments, []);

  return (
    <FundiLayout title="Billing & Plan">
      <div className="space-y-8">
        <Banner kind="info">
          FundiPro never deletes your data if a payment is missed. You get a 7-day grace period before quietly
          dropping back to Free — your job history stays safe either way.
        </Banner>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const isCurrent = user.tier === p.id;
            return (
              <div key={p.id} className={`card ${p.id === "pro" ? "border-terracotta ring-1 ring-terracotta" : ""}`}>
                <h3 className="font-display font-bold text-bark">{p.label}</h3>
                <p className="font-display text-2xl font-bold text-bark mt-1">KES {p.price}<span className="text-sm font-body font-normal text-muted">/mo</span></p>
                <ul className="text-sm text-ink/80 mt-3 space-y-1.5">
                  {p.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
                {isCurrent ? (
                  <span className="btn-secondary w-full mt-5 cursor-default opacity-70">Current plan</span>
                ) : p.id === "free" ? (
                  <span className="text-xs text-muted block mt-5">Downgrade by letting your plan lapse.</span>
                ) : (
                  <button className="btn-primary w-full mt-5" onClick={() => setModalTier(p.id)}>
                    Upgrade via M-Pesa
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="font-display font-bold text-bark mb-3">Payment history</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">No payments yet.</p>
          ) : (
            <div className="card divide-y divide-bark/10">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-sm">
                  <span className="text-bark">{p.tier} upgrade</span>
                  <span className="text-muted">{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className={p.status === "success" ? "text-good font-semibold" : p.status === "failed" ? "text-bad" : "text-muted"}>
                    {p.status === "success" ? `KES ${p.amount}` : p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalTier && (
        <StkModal
          tier={modalTier}
          onClose={() => {
            setModalTier(null);
            loadPayments();
          }}
          onSuccess={() => {
            refreshMe();
            loadPayments();
          }}
        />
      )}
    </FundiLayout>
  );
}
