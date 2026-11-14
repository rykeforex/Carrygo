import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";
import { timeAgo } from "../lib/format";

export default function NotificationBell({ onOpenPickup }) {
  const { items, unread, error, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setFresh(new Set(items.filter((i) => !i.read_at).map((i) => i.id)));
      markAllRead();
    }
  };

  return (
    <div className="cg-bell" ref={ref}>
      <button type="button" className="cg-theme-toggle" onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}>
        <Bell size={16} strokeWidth={2.2} />
        {unread > 0 && <span className="cg-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="cg-notif-panel glass" role="region" aria-label="Notifications">
          <div className="cg-notif-head">Notifications</div>
          {error && <p className="cg-field-error">{error}</p>}
          {!error && items.length === 0 && <p className="cg-notif-empty">Nothing yet. Updates about your pickups will appear here.</p>}
          {items.map((n) => (
            <button key={n.id} type="button" className={`cg-notif-item ${fresh.has(n.id) ? "is-new" : ""}`}
              onClick={() => { if (n.pickup_id) onOpenPickup(n.pickup_id); setOpen(false); }}>
              <strong>{n.title}</strong>
              {n.body && <span>{n.body}</span>}
              <em>{timeAgo(n.created_at)}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
