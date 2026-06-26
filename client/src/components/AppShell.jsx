import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TierBadge } from "./ui";

function NavItem({ to, label, icon, end, badge }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
          isActive ? "bg-terracotta text-white shadow-sm" : "text-sand/75 hover:bg-white/8 hover:text-white"
        }`
      }>
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && <span className="h-5 min-w-5 rounded-full bg-bad text-white text-[10px] font-bold flex items-center justify-center px-1">{badge}</span>}
    </NavLink>
  );
}

export default function AppShell({ nav, title, children, headerRight }) {
  const { user, logout, setTheme } = useAuth();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  const isDark = user?.theme === "dark";

  return (
    <div className="min-h-screen flex" style={{background:"var(--bg)"}}>
      {/* Mobile overlay */}
      {sideOpen && <div className="fixed inset-0 bg-bark/50 z-20 md:hidden" onClick={() => setSideOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`sidebar fixed md:relative z-30 md:z-auto w-64 min-h-screen flex flex-col ${sideOpen?"open":""}`}
        style={{background:"var(--sidebar)"}}>
        <div className="px-5 py-5 flex items-center gap-2.5 font-display font-bold text-lg text-white border-b border-white/10">
          <span className="h-8 w-8 rounded-full bg-terracotta flex items-center justify-center text-white text-sm font-bold">F</span>
          FundiPro
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => <NavItem key={item.to} {...item}/>)}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          {/* Theme toggle */}
          <button onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-full flex items-center gap-2 text-xs text-sand/70 hover:text-white rounded-lg px-2 py-1.5 transition-colors">
            <span>{isDark ? "☀️" : "🌙"}</span>
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <div>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <div className="mt-1 flex items-center gap-2">
              {user?.role === "fundi" && <TierBadge tier={user.tier}/>}
              <span className="text-xs text-sand/60 capitalize">{user?.role}</span>
            </div>
            <button onClick={() => { logout(); navigate("/"); }}
              className="mt-2 text-xs text-sand/60 hover:text-white underline transition-colors">
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b sticky top-0 z-10 px-5 md:px-8 py-4 flex items-center justify-between gap-4"
          style={{background:"var(--card)", borderColor:"var(--border)"}}>
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setSideOpen((v) => !v)} className="md:hidden text-xl p-1">☰</button>
            <h1 className="page-title text-xl">{title}</h1>
          </div>
          {headerRight && <div className="flex items-center gap-3">{headerRight}</div>}
        </header>
        <div className="flex-1 p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
