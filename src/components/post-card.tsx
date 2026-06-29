import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, Share2, Trash2, MoreHorizontal, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/app-shell";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

export type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
};

export function PostCard({
  post,
  currentUserId,
  onDelete,
  onChange,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onDelete?: (id: string) => void;
  onChange?: (p: FeedPost) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_me);
  const [bumping, setBumping] = useState(false);
  const isOwner = currentUserId === post.author_id;

  async function toggleLike() {
    if (!currentUserId) return toast.error("Sign in to like");
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    if (next) setBumping(true);
    setTimeout(() => setBumping(false), 400);
    if (next) {
      const { error } = await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId });
      if (error) {
        setLiked(false);
        setLikesCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      if (error) {
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    }
    onChange?.({ ...post, liked_by_me: next, likes_count: likesCount + (next ? 1 : -1) });
  }

  async function toggleBookmark() {
    if (!currentUserId) return;
    const next = !bookmarked;
    setBookmarked(next);
    if (next) {
      await supabase.from("bookmarks").insert({ post_id: post.id, user_id: currentUserId });
      toast.success("Saved");
    } else {
      await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    }
  }

  async function del() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onDelete?.(post.id);
  }

  async function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  const p = post.profiles;

  return (
    <article className="glass-panel rounded-3xl p-5 transition hover:bg-white/[0.07]">
      <header className="flex items-center gap-3">
        <Link to="/profile/$username" params={{ username: p?.username ?? "" }}>
          <Avatar src={p?.avatar_url} name={p?.full_name ?? p?.username} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/profile/$username"
            params={{ username: p?.username ?? "" }}
            className="flex items-center gap-1 truncate text-sm font-semibold hover:underline"
          >
            {p?.full_name ?? p?.username}
            {p?.verified && <BadgeCheck className="h-4 w-4 text-cyan" />}
          </Link>
          <div className="truncate text-xs text-muted-foreground">
            @{p?.username} · {timeAgo(post.created_at)}
          </div>
        </div>
        {isOwner && (
          <button onClick={del} className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {!isOwner && (
          <button className="rounded-full p-2 text-muted-foreground hover:bg-white/10">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </header>

      <Link to="/post/$id" params={{ id: post.id }} className="mt-3 block">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-glass-border">
            <img src={post.image_url} alt="" className="w-full object-cover" loading="lazy" />
          </div>
        )}
      </Link>

      <footer className="mt-4 flex items-center gap-1 text-sm">
        <button
          onClick={toggleLike}
          className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
            liked ? "text-coral" : "text-muted-foreground hover:text-coral"
          } hover:bg-coral/10`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""} ${bumping ? "animate-heart-pop" : ""}`} />
          <span className="tabular-nums">{likesCount}</span>
        </button>
        <Link
          to="/post/$id"
          params={{ id: post.id }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.comments_count}</span>
        </Link>
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          onClick={toggleBookmark}
          className={`ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
            bookmarked ? "text-amber" : "text-muted-foreground hover:text-amber"
          } hover:bg-amber/10`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        </button>
      </footer>
    </article>
  );
}

export function PostSkeleton() {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded skeleton" />
          <div className="h-2 w-20 rounded skeleton" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-4/5 rounded skeleton" />
      </div>
    </div>
  );
}

/** Hydrate a list of post rows with likes/comments counts and current-user flags. */
export async function hydratePosts(
  rows: Array<{
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    author_id: string;
  }>,
  currentUserId: string | null,
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));

  const [{ data: profiles }, { data: likes }, { data: comments }, likedRes, savedRes] = await Promise.all([
    supabase.from("profiles").select("id,username,full_name,avatar_url,verified").in("id", authorIds),
    supabase.from("likes").select("post_id").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids),
    currentUserId
      ? supabase.from("likes").select("post_id").in("post_id", ids).eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    currentUserId
      ? supabase.from("bookmarks").select("post_id").in("post_id", ids).eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const likeCounts = new Map<string, number>();
  (likes ?? []).forEach((l) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  (comments ?? []).forEach((c) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));
  const likedSet = new Set((likedRes.data ?? []).map((l) => l.post_id));
  const savedSet = new Set((savedRes.data ?? []).map((l) => l.post_id));

  return rows.map((r) => ({
    ...r,
    profiles: pMap.get(r.author_id) ?? null,
    likes_count: likeCounts.get(r.id) ?? 0,
    comments_count: commentCounts.get(r.id) ?? 0,
    liked_by_me: likedSet.has(r.id),
    bookmarked_by_me: savedSet.has(r.id),
  }));
}

/** Effect-friendly subscribe to mount unread; intentionally not exported elsewhere. */
export function useSyncedTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
