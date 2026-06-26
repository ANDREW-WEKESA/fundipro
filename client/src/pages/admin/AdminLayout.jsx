import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

export default function AdminLayout({ title, headerRight, children }) {
  const [unread, setUnread] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    api.get("/messages/conversations").then(({ data }) => {
      setUnread(data.conversations.reduce((a, c) => a + c.unread_count, 0));
    }).catch(() => {});
    api.get("/admin/tickets").then(({ data }) => {
      setOpenTickets(data.tickets.filter((t) => t.status === "open").length);
    }).catch(() => {});
  }, []);

  const NAV = [
    { to: "/admin",           label: "Overview",      icon: "📊", end: true },
    { to: "/admin/fundis",    label: "All Fundis",    icon: "🛠️" },
    { to: "/admin/orders",    label: "All Orders",    icon: "📋" },
    { to: "/admin/chat",      label: "Messages",      icon: "💬", badge: unread },
    { to: "/admin/support",   label: "Support Tickets", icon: "🎫", badge: openTickets },
  ];

  return <AppShell nav={NAV} title={title} headerRight={headerRight}>{children}</AppShell>;
}
