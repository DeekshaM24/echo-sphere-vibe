import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Avatar } from "@/components/app-shell";
import { PostCard, hydratePosts, type FeedPost } from "@/components/post-card";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — EchoSpace" }] }),
  component: Search,
});

function Search() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null; verified: boolean }[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 1) {
        setUsers([]);
        setPosts([]);
        return;
      }
      const term = `%${q.trim()}%`;
      const [{ data: u }, { data: p }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url,verified")
          .or(`username.ilike.${term},full_name.ilike.${term}`)
          .limit(10),
        supabase
          .from("posts")
          .select("id,content,image_url,created_at,author_id")
          .ilike("content", term)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setUsers(u ?? []);
      setPosts(await hydratePosts(p ?? [], me));
    }, 250);
    return () => clearTimeout(t);
  }, [q, me]);

  return (
    <AppShell>
      <h1 className="mb-4 font-display text-3xl font-extrabold tracking-tight">
        Find people & <span className="gradient-text">posts</span>
      </h1>

      <div className="glass-panel mb-6 flex items-center gap-3 rounded-full px-5 py-3">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search usernames, names, post text…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {users.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">People</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {users.map((u) => (
              <Link
                key={u.id}
                to="/profile/$username"
                params={{ username: u.username }}
                className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:bg-white/10"
              >
                <Avatar src={u.avatar_url} name={u.full_name ?? u.username} size={44} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 truncate text-sm font-semibold">
                    {u.full_name ?? u.username}
                    {u.verified && <BadgeCheck className="h-4 w-4 text-cyan" />}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Posts</h2>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={me} />
          ))}
        </section>
      )}

      {q.length > 0 && users.length === 0 && posts.length === 0 && (
        <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
          Nothing matches "{q}". Try a different keyword.
        </div>
      )}
    </AppShell>
  );
}
