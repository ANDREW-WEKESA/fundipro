import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

export default function FundiLayout({ title, headerRight, children }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    api.get("/messages").then(({ data }) => {
      const unread = data.messages.filter((m) => !m.read && m.from_user_id !== "self").length;
      setUnreadMessages(unread);
    }).catch(() => {});
    api.get("/materials").then(({ data }) => setLowStock(data.low_stock_count || 0)).catch(() => {});
  }, []);

  const NAV = [
    { to: "/app",          label: "Overview",       icon: "🏠", end: true },
    { to: "/app/jobs",     label: "Jobs & Calculator", icon: "🧮" },
    { to: "/app/products", label: "My Products",    icon: "🛠️" },
    { to: "/app/orders",   label: "Orders",         icon: "📋" },
    { to: "/app/clients",  label: "Clients",        icon: "👥" },
    { to: "/app/materials",label: "Tools & Materials", icon: "📦", badge: lowStock },
    { to: "/app/stats",    label: "Statistics",     icon: "📊" },
    { to: "/app/storefront", label: "Storefront",   icon: "🏪" },
    { to: "/app/chat",     label: "Chat with Andrew", icon: "💬", badge: unreadMessages },
    { to: "/app/billing",  label: "Billing & Plan", icon: "💳" },
    { to: "/app/settings", label: "Settings",       icon: "⚙️" },
  ];

  return <AppShell nav={NAV} title={title} headerRight={headerRight}>{children}</AppShell>;
}
