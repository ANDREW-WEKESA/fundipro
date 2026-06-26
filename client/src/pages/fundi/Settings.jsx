import { useState } from "react";
import FundiLayout from "./FundiLayout";
import { Banner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api, { errMsg } from "../../lib/api";

const GOVT_GUIDELINES = [
  { icon:"🏛️", title:"Business Registration", body:"Register your business with the Kenya Business Registration Service (BRS). A sole proprietor can register for as low as KES 950. This gives you a Business Name Certificate, which banks and big clients require." },
  { icon:"🧾", title:"Tax Compliance (KRA PIN)", body:"All businesses must have a KRA PIN number. File your annual returns even if you made no profit — failure to file attracts a penalty of KES 20,000. You can register and file at itax.kra.go.ke." },
  { icon:"🏥", title:"NHIF (National Health Insurance)", body:"Self-employed fundis can join NHIF and pay from KES 500/month for health cover. This protects you and your family when you need medical care." },
  { icon:"💼", title:"NSSF (Pension Contribution)", body:"Contribute to NSSF for your retirement. Self-employed persons can register directly. Even small monthly contributions build up to a real safety net over the years." },
  { icon:"🔧", title:"Trade/Sector Licences", body:"Depending on your trade, you may need a County Business Permit from your County Government (typically KES 2,000–10,000/year). Welders, mechanics, and electricians may need sector-specific certifications." },
  { icon:"📋", title:"Employment Laws (if you have workers)", body:"If you employ others, register with the National Employment Authority. Pay your workers on time, issue payslips, and ensure safe working conditions under the Occupational Safety and Health Act." },
  { icon:"💡", title:"Electricity & Safety", body:"Electrical work must be done by a licensed electrician registered with the Energy and Petroleum Regulatory Authority (EPRA). Non-compliance carries fines and risks to clients." },
  { icon:"🌱", title:"Environmental Compliance", body:"Dispose of waste materials (chemicals, off-cuts, scrap metal) responsibly. Large workshops may need an Environmental Impact Assessment (EIA) from NEMA." },
];

export default function Settings() {
  const { user, setTheme, refreshMe, platformConfig } = useAuth();
  const [pwForm, setPwForm] = useState({ current_password:"", new_password:"", confirm:"" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", trade: user?.trade || "", location: user?.location || "" });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  async function saveProfile(e) {
    e.preventDefault(); setProfileError(""); setProfileSuccess(false);
    try { await api.patch("/storefront/me/profile", profileForm); await refreshMe(); setProfileSuccess(true); }
    catch(err) { setProfileError(errMsg(err)); }
  }

  async function changePassword(e) {
    e.preventDefault(); setPwError(""); setPwSuccess(false);
    if (pwForm.new_password !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    if (pwForm.new_password.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    try { await api.patch("/users/password", { current_password: pwForm.current_password, new_password: pwForm.new_password }); setPwSuccess(true); setPwForm({ current_password:"", new_password:"", confirm:"" }); }
    catch(err) { setPwError(errMsg(err)); }
  }

  return (
    <FundiLayout title="Settings">
      <div className="max-w-3xl space-y-8">

        {/* Profile */}
        <div className="card space-y-4">
          <h2 className="section-title">Profile</h2>
          {profileError && <Banner kind="error">{profileError}</Banner>}
          {profileSuccess && <Banner kind="success">Profile updated.</Banner>}
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({...f,name:e.target.value}))}/></div>
              <div><label className="label">Trade</label><input className="input" value={profileForm.trade} onChange={(e) => setProfileForm((f) => ({...f,trade:e.target.value}))}/></div>
            </div>
            <div><label className="label">Location</label><input className="input" value={profileForm.location} onChange={(e) => setProfileForm((f) => ({...f,location:e.target.value}))}/></div>
            <button className="btn-primary">Save profile</button>
          </form>
        </div>

        {/* Appearance */}
        <div className="card space-y-3">
          <h2 className="section-title">Appearance</h2>
          <p className="text-sm" style={{color:"var(--muted)"}}>Switch between light and dark mode. Your preference is saved.</p>
          <div className="flex gap-3">
            <button onClick={() => setTheme("light")} className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${user?.theme !== "dark" ? "border-terracotta text-terracotta" : "border-transparent"}`} style={{background:"#FBFAF7", color:"#3A2E2A"}}>☀️ Light</button>
            <button onClick={() => setTheme("dark")} className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${user?.theme === "dark" ? "border-terracotta text-terracotta" : "border-transparent"}`} style={{background:"#1C1917", color:"#F5F0EB"}}>🌙 Dark</button>
          </div>
        </div>

        {/* Change password */}
        <div className="card space-y-4">
          <h2 className="section-title">Change Password</h2>
          {pwError && <Banner kind="error">{pwError}</Banner>}
          {pwSuccess && <Banner kind="success">Password changed successfully.</Banner>}
          <form onSubmit={changePassword} className="space-y-3">
            <div><label className="label">Current password</label><input className="input" type="password" value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({...f,current_password:e.target.value}))} required/></div>
            <div><label className="label">New password</label><input className="input" type="password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({...f,new_password:e.target.value}))} required/></div>
            <div><label className="label">Confirm new password</label><input className="input" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({...f,confirm:e.target.value}))} required/></div>
            <button className="btn-primary">Update password</button>
          </form>
        </div>

        {/* Support */}
        <div className="card space-y-3">
          <h2 className="section-title">Support & Contact</h2>
          <p className="text-sm" style={{color:"var(--muted)"}}>Need help? Reach Andrew directly:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`https://wa.me/254${(platformConfig?.support_whatsapp||"").replace(/^0/,"")}`} target="_blank" rel="noreferrer"
              className="btn-primary flex-1 justify-center">💬 WhatsApp {platformConfig?.support_whatsapp}</a>
            <a href={`mailto:${platformConfig?.support_email}`} className="btn-secondary flex-1 justify-center">✉️ {platformConfig?.support_email}</a>
          </div>
          <p className="text-xs" style={{color:"var(--muted)"}}>You can also share your storefront link on WhatsApp, Facebook, or any social media — your clients can browse and order directly.</p>
        </div>

        {/* Govt guidelines */}
        <div className="card space-y-5">
          <div>
            <h2 className="section-title">🏛️ Kenyan Government Guidelines for Fundis</h2>
            <p className="text-sm mt-1" style={{color:"var(--muted)"}}>Know your rights and obligations as a business owner in Kenya.</p>
          </div>
          {GOVT_GUIDELINES.map((g) => (
            <div key={g.title} className="flex gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{g.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{color:"var(--ink)"}}>{g.title}</p>
                <p className="text-sm mt-0.5" style={{color:"var(--muted)"}}>{g.body}</p>
              </div>
            </div>
          ))}
          <p className="text-xs" style={{color:"var(--muted)"}}>Sources: Kenya Business Registration Service (BRS), Kenya Revenue Authority (KRA), NHIF, NSSF, EPRA, NEMA. Always consult a licensed professional for advice specific to your situation.</p>
        </div>
      </div>
    </FundiLayout>
  );
}
