import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { listNotifications, markAllNotificationsRead, subscribeToNotifications } from "../lib/api";
import { useToast } from "./ToastContext";

const Ctx = createContext(null);

export function NotificationsProvider({ userId, children }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    try { setItems(await listNotifications()); setError(null); }
    catch { setError("Couldn't load notifications."); }
  }, []);

  useEffect(() => {
    refresh();
    const off = subscribeToNotifications(userId, (payload) => {
      const n = payload.new;
      setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50));
      showToast(n.title, "info");
    });
    const t = setInterval(refresh, 60000);
    return () => { off(); clearInterval(t); };
  }, [userId, refresh, showToast]);

  const unread = items.filter((i) => !i.read_at).length;
  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
    try { await markAllNotificationsRead(); } catch { refresh(); }
  }, [refresh]);

  return <Ctx.Provider value={{ items, unread, error, refresh, markAllRead }}>{children}</Ctx.Provider>;
}

export const useNotifications = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotifications must be used within NotificationsProvider");
  return v;
};
