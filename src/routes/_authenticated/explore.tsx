import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Heart } from "lucide-react";

type Tile = {
  id: string;
  image_url: string | null;
  content: string;
  likes: number;
};

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({ meta: [{ title: "Explore — EchoSpace" }] }),
  component: Explore,
});

function Explore() {
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("id,image_url,content,created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      const ids = (posts ?? []).map((p) => p.id);
      const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", ids);
      const counts = new Map<string, number>();
      (likes ?? []).forEach((l) => counts.set(l.post_id, (counts.get(l.post_id) ?? 0) + 1));
      const tiles = (posts ?? [])
        .map((p) => ({ ...p, likes: counts.get(p.id) ?? 0 }))
        .sort((a, b) => b.likes - a.likes);
      setTiles(tiles);
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        <span className="gradient-text">Explore</span> the space
      </h1>
      {!tiles && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl skeleton" />
          ))}
        </div>
      )}
      {tiles && tiles.length === 0 && (
        <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
          No posts yet. Check back soon.
        </div>
      )}
      {tiles && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {tiles.map((t) => (
            <Link
              key={t.id}
              to="/post/$id"
              params={{ id: t.id }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-glass-border bg-card"
            >
              {t.image_url ? (
                <img
                  src={t.image_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  {t.content.slice(0, 120)}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-semibold opacity-0 transition group-hover:opacity-100">
                <Heart className="h-3.5 w-3.5 fill-current text-coral" /> {t.likes}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
