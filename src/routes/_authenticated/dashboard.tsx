import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Heart, MessageCircle, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EchoSpace" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<{ posts: number; followers: number; following: number; likes: number } | null>(null);
  const [recent, setRecent] = useState<{ id: string; type: string; created_at: string; actor_name: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const uid = u.user.id;
      const [{ count: posts }, { count: followers }, { count: following }, { data: myPosts }] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", uid),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", uid),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", uid),
        supabase.from("posts").select("id").eq("author_id", uid),
      ]);
      const ids = (myPosts ?? []).map((p) => p.id);
      let likes = 0;
      if (ids.length) {
        const { count } = await supabase.from("likes").select("post_id", { count: "exact", head: true }).in("post_id", ids);
        likes = count ?? 0;
      }
      setStats({ posts: posts ?? 0, followers: followers ?? 0, following: following ?? 0, likes });

      const { data: notifs } = await supabase
        .from("notifications")
        .select("id,type,created_at,actor_id")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(8);
      const actorIds = (notifs ?? []).map((n) => n.actor_id);
      const { data: profs } = await supabase.from("profiles").select("id,full_name,username").in("id", actorIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p.full_name ?? p.username]));
      setRecent((notifs ?? []).map((n) => ({ id: n.id, type: n.type, created_at: n.created_at, actor_name: map.get(n.actor_id) ?? null })));
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={FileText} label="Posts" value={stats?.posts} accent="coral" />
        <StatCard icon={Heart} label="Likes received" value={stats?.likes} accent="magenta" />
        <StatCard icon={Users} label="Followers" value={stats?.followers} accent="cyan" />
        <StatCard icon={Users} label="Following" value={stats?.following} accent="amber" />
      </div>
      <div className="glass-panel rounded-3xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Recent activity</h2>
        {recent.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
        <ul className="space-y-2 text-sm">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/5">
              {r.type === "like" && <Heart className="h-4 w-4 text-coral" />}
              {r.type === "comment" && <MessageCircle className="h-4 w-4 text-cyan" />}
              {r.type === "follow" && <Users className="h-4 w-4 text-amber" />}
              <span className="font-medium">{r.actor_name ?? "Someone"}</span>
              <span className="text-muted-foreground">
                {r.type === "like" ? "liked your post" : r.type === "comment" ? "commented on your post" : "followed you"}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Heart;
  label: string;
  value: number | undefined;
  accent: "coral" | "magenta" | "cyan" | "amber";
}) {
  const tones: Record<string, string> = {
    coral: "bg-coral/15 text-coral",
    magenta: "bg-magenta/15 text-magenta",
    cyan: "bg-cyan/15 text-cyan",
    amber: "bg-amber/15 text-amber",
  };
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${tones[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-3xl font-extrabold tabular-nums">
        {value ?? <span className="inline-block h-6 w-12 rounded skeleton" />}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
