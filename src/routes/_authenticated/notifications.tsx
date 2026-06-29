import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Avatar } from "@/components/app-shell";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EchoSpace" }] }),
  component: Notifs,
});

type Notif = {
  id: string;
  type: "like" | "comment" | "follow";
  actor_id: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor: { username: string; full_name: string | null; avatar_url: string | null } | null;
};

function Notifs() {
  const [list, setList] = useState<Notif[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("notifications")
        .select("id,type,actor_id,post_id,read,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const ids = (data ?? []).map((n) => n.actor_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      const enriched: Notif[] = (data ?? []).map((n) => ({
        ...(n as Omit<Notif, "actor">),
        actor: map.get(n.actor_id) ?? null,
      }));
      setList(enriched);
      // mark read
      await supabase.from("notifications").update({ read: true }).eq("user_id", u.user.id).eq("read", false);
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Notifications</h1>
      {!list && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl skeleton" />
          ))}
        </div>
      )}
      {list && list.length === 0 && (
        <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
          You're all caught up.
        </div>
      )}
      <ul className="space-y-2">
        {list?.map((n) => {
          const Icon = n.type === "like" ? Heart : n.type === "comment" ? MessageCircle : UserPlus;
          const color = n.type === "like" ? "text-coral" : n.type === "comment" ? "text-cyan" : "text-amber";
          const verb = n.type === "like" ? "liked your post" : n.type === "comment" ? "commented on your post" : "started following you";
          const inner = (
            <div className={`glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:bg-white/10 ${n.read ? "" : "ring-1 ring-coral/40"}`}>
              <Avatar src={n.actor?.avatar_url} name={n.actor?.full_name ?? n.actor?.username} size={40} />
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{n.actor?.full_name ?? n.actor?.username ?? "Someone"}</span>{" "}
                <span className="text-muted-foreground">{verb}</span>
                <div className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          );
          return (
            <li key={n.id}>
              {n.post_id ? (
                <Link to="/post/$id" params={{ id: n.post_id }}>
                  {inner}
                </Link>
              ) : n.actor ? (
                <Link to="/profile/$username" params={{ username: n.actor.username }}>
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
