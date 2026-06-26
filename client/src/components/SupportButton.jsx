import { useState } from "react";
import { useConfig } from "../context/ConfigContext";

export default function SupportButton() {
  const { support_whatsapp, support_email } = useConfig();
  const [open, setOpen] = useState(false);

  if (!support_whatsapp) return null;
  const waLink = `https://wa.me/254${support_whatsapp.replace(/^0/, "")}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="card w-64 !p-4">
          <p className="font-display font-bold text-bark dark:text-sand text-sm">Need help?</p>
          <p className="text-xs text-muted dark:text-sand/60 mt-1">Reach Andrew directly — fundi to founder.</p>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary w-full mt-3 text-xs">
            WhatsApp support
          </a>
          {support_email && (
            <a href={`mailto:${support_email}`} className="btn-secondary w-full mt-2 text-xs">
              Email {support_email}
            </a>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-12 w-12 rounded-full bg-good text-white shadow-card flex items-center justify-center text-xl hover:scale-105 transition-transform"
        aria-label="Support"
        title="Support"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
