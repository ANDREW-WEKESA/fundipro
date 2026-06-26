import { useEffect, useRef, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

export default function Chat() {
  const { user, platformConfig } = useAuth();
  const [messages, setMessages] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  async function load() {
    const { data } = await api.get("/messages");
    setMessages(data.messages);
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try { await api.post("/messages", { body }); setBody(""); await load(); }
    catch(err) { alert(errMsg(err)); }
    finally { setSending(false); }
  }

  function formatTime(iso) {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : d.toLocaleDateString();
  }

  return (
    <FundiLayout title="Chat with Andrew">
      <div className="max-w-2xl flex flex-col" style={{height:"calc(100vh - 140px)"}}>
        {/* Info bar */}
        <div className="card mb-3 flex items-center gap-3 py-3">
          <div className="h-10 w-10 rounded-full bg-terracotta flex items-center justify-center text-white font-bold shrink-0">A</div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{color:"var(--ink)"}}>Andrew Wekesa — FundiPro</p>
            <p className="text-xs" style={{color:"var(--muted)"}}>
              Chat here or WhatsApp: <a href={`https://wa.me/254${(platformConfig?.support_whatsapp||"").replace(/^0/,"")}`} target="_blank" rel="noreferrer" className="text-terracotta font-semibold">{platformConfig?.support_whatsapp}</a>
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2 px-1">
          {messages === null ? <Spinner/> : messages.length === 0 ? (
            <p className="text-center text-sm py-10" style={{color:"var(--muted)"}}>No messages yet. Say hello to Andrew 👋</p>
          ) : messages.map((m) => (
            <div key={m.id}>
              {m.system ? (
                <div className="bubble-system">
                  <p>{m.body}</p>
                  <p className="mt-0.5 opacity-60">{formatTime(m.created_at)}</p>
                </div>
              ) : m.from_user_id === user.id ? (
                <div className="flex flex-col items-end gap-0.5">
                  <div className="bubble-out">{m.body}</div>
                  <p className="text-[10px]" style={{color:"var(--muted)"}}>{formatTime(m.created_at)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-0.5">
                  <div className="bubble-in">{m.body}</div>
                  <p className="text-[10px]" style={{color:"var(--muted)"}}>{formatTime(m.created_at)}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex gap-2 pt-3 border-t mt-2" style={{borderColor:"var(--border)"}}>
          <input className="input flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" autoComplete="off"/>
          <button className="btn-primary px-5" disabled={sending || !body.trim()}>Send</button>
        </form>
      </div>
    </FundiLayout>
  );
}
