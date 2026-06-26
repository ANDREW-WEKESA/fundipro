import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tierConfig, setTierConfig] = useState(null);
  const [platformConfig, setPlatformConfig] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("fundipro_token");
    if (!token) { setUser(null); setReady(true); return; }
    try {
      const { data } = await api.get("/users/me");
      setUser(data.user);
      setTierConfig(data.tier_config);
    } catch {
      localStorage.removeItem("fundipro_token");
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    api.get("/config").then(({ data }) => setPlatformConfig(data)).catch(() => {});
  }, [refreshMe]);

  function login(token, userObj) {
    localStorage.setItem("fundipro_token", token);
    setUser(userObj);
    refreshMe();
  }

  function logout() {
    localStorage.removeItem("fundipro_token");
    setUser(null);
  }

  // Dark/light mode toggle stored per-user on backend + mirrored in localStorage
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    api.patch("/users/theme", { theme }).catch(() => {});
    setUser((u) => u ? { ...u, theme } : u);
  }

  // Apply saved theme on load
  useEffect(() => {
    if (user?.theme) document.documentElement.setAttribute("data-theme", user.theme);
  }, [user?.theme]);

  return (
    <AuthContext.Provider value={{ user, tierConfig, platformConfig, ready, login, logout, refreshMe, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
