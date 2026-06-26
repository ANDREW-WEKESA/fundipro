import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-bark/10 bg-cream/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg text-bark">
          <span className="h-8 w-8 rounded-full bg-terracotta flex items-center justify-center text-white text-sm">F</span>
          FundiPro
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm font-medium text-ink">
          <Link to="/#pricing" className="hover:text-terracotta">Pricing</Link>
          <Link to="/#how-it-works" className="hover:text-terracotta">How it works</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              className="btn-primary"
              onClick={() => navigate(user.role === "admin" ? "/admin" : "/app")}
            >
              Go to dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/signup" className="btn-primary">Get started free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
