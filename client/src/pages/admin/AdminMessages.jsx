import { useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null); // fundi_id
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  function loadConversations() {
    api.get("/messages/conversations").then(({ data }) => setConversations(data.conversations));
  }

  function loadThread(fundiId) {
    api.get(`/messages?with=${fundiId}`).then(({ data }) => setMessages(data.messages));
  }

  useEffect(() => {
    loadConversations();
    const iv = setInterval(loadConversations, 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (active) {
      loadThread(active);
      const iv = setInterval(() => loadThread(active), 5000);
      return () => clearInterval(iv);
    }
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      await api.post("/messages", { body: text.trim(), to_user_id: active });
      setText("");
      loadThread(active);
      loadConversations();
    } finally {
      setSending(false);
    }
  }

  const activeConv = conversations?.find((c) => c.fundi_id === active);

  return (
    <AdminLayout title="Messages">
      <div className="flex gap-5 h-[75vh]">
        {/* Conversation list */}
        <div className="w-64 shrink-0 card !p-0 overflow-y-auto">
          <p className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted dark:text-sand/50 border-b border-bark/10 dark:border-white/10">
            Fundis
          </p>
          {conversations === null ? (
            <Spinner />
          ) : conversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted dark:text-sand/50">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.fundi_id}
                onClick={() => setActive(c.fundi_id)}
                className={`w-full text-left px-4 py-3 border-b border-bark/5 dark:border-white/5 hover:bg-sand/20 dark:hover:bg-white/5 ${
                  active === c.fundi_id ? "bg-terracotta/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-bark dark:text-sand truncate">{c.fundi_name}</p>
                  {c.unread_count > 0 && (
                    <span className="h-5 w-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                {c.last_message && (
                  <p className="text-xs text-muted dark:text-sand/50 truncate mt-0.5">{c.last_message}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 card !p-0 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted dark:text-sand/50">
              Select a fundi to view messages
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-bark/10 dark:border-white/10">
                <p className="font-display font-bold text-bark dark:text-sand text-sm">{activeConv?.fundi_name}</p>
                <a href={`/s/${conversations?.find((c) => c.fundi_id === active)?.fundi_slug}`} target="_blank" rel="noreferrer" className="text-xs text-terracotta hover:underline">
                  View storefront
                </a>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((m) => {
                  const fromMe = m.from_user_id === user.id;
                  const isSystem = m.from_user_id === "system";
                  return (
                    <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isSystem
                            ? "bg-sand/60 dark:bg-white/10 text-bark dark:text-sand italic"
                            : fromMe
                            ? "bg-terracotta text-white"
                            : "bg-sand dark:bg-white/10 text-bark dark:text-sand"
                        }`}
                      >
                        {isSystem && <p className="text-[10px] font-bold uppercase opacity-60 mb-1">System reminder</p>}
                        {m.body}
                        <p className={`text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-muted dark:text-sand/40"}`}>
                          {new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="border-t border-bark/10 dark:border-white/10 p-3 flex gap-2">
                <input className="input flex-1" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn-primary" disabled={sending}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
