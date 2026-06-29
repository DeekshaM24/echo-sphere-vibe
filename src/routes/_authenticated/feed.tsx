import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Composer } from "@/components/composer";
import { PostCard, PostSkeleton, hydratePosts, type FeedPost } from "@/components/post-card";
import { SuggestedUsers } from "@/components/suggested-users";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Home — EchoSpace" }] }),
  component: Feed,
});

function Feed() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [me, setMe] = useState<{ id: string; avatar_url: string | null; full_name: string | null } | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,avatar_url,full_name")
      .eq("id", u.user.id)
      .maybeSingle();
    setMe(profile);

    const { data: rows } = await supabase
      .from("posts")
      .select("id,content,image_url,created_at,author_id")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(await hydratePosts(rows ?? [], u.user.id));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Your <span className="gradient-text">feed</span>
            </h1>
          </div>
          {me && (
            <Composer
              currentUserId={me.id}
              avatarUrl={me.avatar_url}
              fullName={me.full_name}
              onCreated={load}
            />
          )}
          {!posts && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}
          {posts &&
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={me?.id ?? null}
                onDelete={(id) => setPosts((cur) => (cur ?? []).filter((x) => x.id !== id))}
              />
            ))}
          {posts && posts.length === 0 && (
            <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
              The space is quiet. Be the first to post.
            </div>
          )}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <SuggestedUsers />
            <Trending />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Trending() {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Trending
      </h3>
      <ul className="space-y-2 text-sm">
        {["#echospace", "#design", "#ai", "#codealpha", "#cosmic"].map((t) => (
          <li key={t} className="flex items-center justify-between rounded-xl p-2 hover:bg-white/5">
            <span className="font-medium gradient-text">{t}</span>
            <span className="text-xs text-muted-foreground">trending</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
