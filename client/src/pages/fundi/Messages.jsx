import { useEffect, useRef, useState } from "react";
import FundiLayout from "./FundiLayout";
import { Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    api.get("/messages").then(({ data }) => setMessages(data.messages));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post("/messages", { body: text.trim() });
      setText("");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <FundiLayout title="Messages">
      <div className="card !p-0 flex flex-col h-[70vh] max-w-2xl">
        <div className="px-5 py-3 border-b border-bark/10 dark:border-white/10">
          <p className="font-display font-bold text-bark dark:text-sand text-sm">Chat with Andrew (FundiPro)</p>
          <p className="text-xs text-muted dark:text-sand/50">Direct line to the founder — plus daily reminders to keep your records honest and up to date.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages === null ? (
            <Spinner />
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted dark:text-sand/50 text-center mt-10">No messages yet — say habari 👋</p>
          ) : (
            messages.map((m) => {
              const fromMe = m.from_user_id === user.id;
              const isSystem = m.from_user_id === "system";
              return (
                <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isSystem
                        ? "bg-sand/60 dark:bg-white/10 text-bark dark:text-sand italic"
                        : fromMe
                        ? "bg-terracotta text-white"
                        : "bg-sand dark:bg-white/10 text-bark dark:text-sand"
                    }`}
                  >
                    {isSystem && <p className="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-1">FundiPro reminder</p>}
                    {m.body}
                    <p className={`text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-muted dark:text-sand/40"}`}>
                      {new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-bark/10 dark:border-white/10 p-3 flex gap-2">
          <input className="input flex-1" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-primary" disabled={sending}>Send</button>
        </form>
      </div>
    </FundiLayout>
  );
}
