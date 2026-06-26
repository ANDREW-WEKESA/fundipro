import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

export default function AdminChat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState(null);
  const [activeFundiId, setActiveFundiId] = useState(searchParams.get("with") || null);
  const [messages, setMessages] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  async function loadConvos() {
    const { data } = await api.get("/messages/conversations");
    setConversations(data.conversations);
  }
  useEffect(() => { loadConvos(); }, []);

  async function loadThread(fundiId) {
    if (!fundiId) return;
    const { data } = await api.get(`/messages?with=${fundiId}`);
    setMessages(data.messages);
  }
  useEffect(() => { loadThread(activeFundiId); const t = setInterval(() => loadThread(activeFundiId), 6000); return () => clearInterval(t); }, [activeFundiId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim() || !activeFundiId) return;
    setSending(true);
    try { await api.post("/messages", { body, to_user_id: activeFundiId }); setBody(""); await loadThread(activeFundiId); await loadConvos(); }
    catch(err) { alert(errMsg(err)); }
    finally { setSending(false); }
  }

  const activeFundi = conversations?.find((c) => c.fundi_id === activeFundiId);

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date().toDateString() === d.toDateString()
      ? d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
      : d.toLocaleDateString();
  }

  return (
    <AdminLayout title="Messages">
      <div className="flex gap-5 max-w-6xl" style={{height:"calc(100vh - 140px)"}}>
        {/* Conversation list */}
        <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {conversations === null ? <Spinner/> : conversations.length === 0 ? (
            <p className="text-sm text-center py-8" style={{color:"var(--muted)"}}>No conversations yet.</p>
          ) : conversations.map((c) => (
            <button key={c.fundi_id} onClick={() => setActiveFundiId(c.fundi_id)}
              className={`w-full text-left rounded-xl px-3.5 py-3 transition-all ${activeFundiId === c.fundi_id ? "bg-terracotta text-white" : "hover:opacity-80"}`}
              style={activeFundiId !== c.fundi_id ? {background:"var(--card)"} : {}}>
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold text-sm truncate ${activeFundiId === c.fundi_id ? "text-white" : ""}`} style={activeFundiId !== c.fundi_id ? {color:"var(--ink)"} : {}}>{c.fundi_name}</p>
                {c.unread_count > 0 && <span className="h-5 min-w-5 rounded-full bg-bad text-white text-[10px] font-bold flex items-center justify-center px-1">{c.unread_count}</span>}
              </div>
              {c.last_message && <p className={`text-xs truncate mt-0.5 ${activeFundiId === c.fundi_id ? "text-white/70" : ""}`} style={activeFundiId !== c.fundi_id ? {color:"var(--muted)"} : {}}>{c.last_message}</p>}
              {c.last_message_at && <p className={`text-[10px] mt-0.5 ${activeFundiId === c.fundi_id ? "text-white/60" : ""}`} style={activeFundiId !== c.fundi_id ? {color:"var(--muted)"} : {}}>{formatTime(c.last_message_at)}</p>}
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeFundiId ? (
            <div className="flex-1 flex items-center justify-center" style={{color:"var(--muted)"}}>
              <p className="text-sm">Select a conversation from the left</p>
            </div>
          ) : (
            <>
              <div className="card mb-3 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-terracotta flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {activeFundi?.fundi_name?.[0]||"F"}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{color:"var(--ink)"}}>{activeFundi?.fundi_name}</p>
                  <a href={`/s/${activeFundi?.fundi_slug}`} target="_blank" rel="noreferrer" className="text-xs text-terracotta hover:underline">/s/{activeFundi?.fundi_slug}</a>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pb-2 px-1">
                {messages === null ? <Spinner/> : messages.map((m) => (
                  <div key={m.id}>
                    {m.system ? (
                      <div className="bubble-system"><p>{m.body}</p></div>
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

              <form onSubmit={send} className="flex gap-2 pt-3 border-t mt-2" style={{borderColor:"var(--border)"}}>
                <input className="input flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Message ${activeFundi?.fundi_name}…`}/>
                <button className="btn-primary px-5" disabled={sending || !body.trim()}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
