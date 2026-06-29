import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PostCard, hydratePosts, type FeedPost } from "@/components/post-card";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — EchoSpace" }] }),
  component: Bookmarks,
});

function Bookmarks() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setMe(u.user.id);
      const { data: bm } = await supabase
        .from("bookmarks")
        .select("post_id,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      const ids = (bm ?? []).map((b) => b.post_id);
      if (ids.length === 0) {
        setPosts([]);
        return;
      }
      const { data: rows } = await supabase
        .from("posts")
        .select("id,content,image_url,created_at,author_id")
        .in("id", ids);
      const ordered = ids
        .map((id) => (rows ?? []).find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
      setPosts(await hydratePosts(ordered, u.user.id));
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        Your <span className="gradient-text">bookmarks</span>
      </h1>
      {!posts && <div className="h-32 rounded-2xl skeleton" />}
      {posts && posts.length === 0 && (
        <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
          No saves yet. Tap the bookmark icon on any post.
        </div>
      )}
      <div className="space-y-4">
        {posts?.map((p) => (
          <PostCard key={p.id} post={p} currentUserId={me} />
        ))}
      </div>
    </AppShell>
  );
}
