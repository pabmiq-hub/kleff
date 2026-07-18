import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function NotificationsBell() {
  const listFn = useServerFn(listMyNotifications);
  const readFn = useServerFn(markNotificationRead);
  const readAllFn = useServerFn(markAllNotificationsRead);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const r = await listFn({ data: undefined as never });
      setItems(r.notifications as Notif[]);
      setUnread(r.unread);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleItemClick = async (n: Notif) => {
    if (!n.read_at) {
      await readFn({ data: { id: n.id } }).catch(() => {});
      void refresh();
    }
    if (!n.url) setOpen(false);
  };

  const handleMarkAll = async () => {
    await readAllFn({ data: undefined as never }).catch(() => {});
    void refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative p-2 rounded-lg hover:bg-primary-soft/40 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-cream text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-ink/20 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10">
            <p className="font-semibold text-sm">Notificaciones</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-coral-deep hover:underline"
              >
                Marcar todo leído
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-ink/50 text-sm py-8">Sin notificaciones</p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div
                    className={`px-4 py-3 border-b border-ink/5 hover:bg-primary-soft/20 transition-colors ${
                      !n.read_at ? "bg-coral/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-coral shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-ink/70 mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[10px] text-ink/40 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
                return n.url ? (
                  <Link
                    key={n.id}
                    to={n.url}
                    onClick={() => void handleItemClick(n)}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void handleItemClick(n)}
                    className="block w-full text-left"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
