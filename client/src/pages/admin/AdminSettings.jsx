import AdminLayout from "./AdminLayout";
import { useTheme } from "../../context/ThemeContext";
import { useConfig } from "../../context/ConfigContext";

export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const { support_whatsapp, support_email } = useConfig();

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="font-display font-bold text-bark dark:text-sand mb-3">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink dark:text-sand">Dark mode</p>
              <p className="text-xs text-muted dark:text-sand/50">Easier on the eyes in the evenings.</p>
            </div>
            <button onClick={toggleTheme} className="btn-secondary">{theme === "dark" ? "Switch to light" : "Switch to dark"}</button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-bark dark:text-sand mb-3">Platform contact details</h2>
          <div className="space-y-2 text-sm text-ink/80 dark:text-sand/70">
            <p><span className="font-semibold">Support WhatsApp:</span> {support_whatsapp || "—"}</p>
            <p><span className="font-semibold">Support email:</span> {support_email || "—"}</p>
            <p className="text-xs text-muted dark:text-sand/50 mt-3">
              To update these, edit <code className="bg-sand/60 dark:bg-white/10 px-1 rounded">server/config.js</code> and redeploy.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-bark dark:text-sand mb-1">Phase 2 — referral commission</h2>
          <p className="text-sm text-muted dark:text-sand/60">
            A 2% commission on fundi profit is already stubbed in <code className="bg-sand/60 dark:bg-white/10 px-1 rounded">server/config.js</code> as <code className="bg-sand/60 dark:bg-white/10 px-1 rounded">REFERRAL_COMMISSION_RATE</code>.
            It is deliberately not active yet. When you're ready, wire it into <code className="bg-sand/60 dark:bg-white/10 px-1 rounded">routes/orders.js</code> on order completion.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
