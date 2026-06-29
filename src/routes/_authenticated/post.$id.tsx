import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Avatar } from "@/components/app-shell";
import { PostCard, hydratePosts, type FeedPost } from "@/components/post-card";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/post/$id")({
  head: () => ({ meta: [{ title: "Post — EchoSpace" }] }),
  component: PostDetail,
});

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
};

function PostDetail() {
  const { id } = Route.useParams();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setMe(uid);
    const { data: rows } = await supabase
      .from("posts")
      .select("id,content,image_url,created_at,author_id")
      .eq("id", id)
      .maybeSingle();
    if (!rows) {
      setNotFound(true);
      return;
    }
    const [hydrated] = await hydratePosts([rows], uid);
    setPost(hydrated);

    const { data: cs } = await supabase
      .from("comments")
      .select("id,content,created_at,author_id")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    const ids = (cs ?? []).map((c) => c.author_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,username,full_name,avatar_url")
      .in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    setComments(
      (cs ?? []).map((c) => ({ ...c, profiles: map.get(c.author_id) ?? null })),
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function comment(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !text.trim()) return;
    setPosting(true);
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: id, author_id: me, content: text.trim().slice(0, 500) });
    setPosting(false);
    if (error) return toast.error(error.message);
    setText("");
    load();
  }

  async function delComment(cid: string) {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", cid);
    if (error) return toast.error(error.message);
    setComments((cs) => cs.filter((c) => c.id !== cid));
  }

  if (notFound) {
    return (
      <AppShell>
        <div className="glass-panel rounded-3xl p-10 text-center">
          <h2 className="font-display text-2xl font-bold">Post not found</h2>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/feed" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      {!post && <div className="h-40 rounded-3xl skeleton" />}
      {post && (
        <>
          <PostCard post={post} currentUserId={me} />
          <section className="mt-4 glass-panel rounded-3xl p-5">
            <h2 className="mb-4 font-display text-lg font-bold">{comments.length} comments</h2>
            {me && (
              <form onSubmit={comment} className="mb-5 flex items-start gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={500}
                  className="flex-1 rounded-2xl border border-glass-border bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={posting || !text.trim()}
                  className="inline-flex items-center gap-1 rounded-full bg-[image:var(--gradient-primary)] px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Link to="/profile/$username" params={{ username: c.profiles?.username ?? "" }}>
                    <Avatar src={c.profiles?.avatar_url} name={c.profiles?.full_name ?? c.profiles?.username} size={36} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Link
                        to="/profile/$username"
                        params={{ username: c.profiles?.username ?? "" }}
                        className="font-semibold hover:underline"
                      >
                        {c.profiles?.full_name ?? c.profiles?.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                      {me === c.author_id && (
                        <button onClick={() => delComment(c.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[15px]">{c.content}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && <li className="text-sm text-muted-foreground">Be the first to comment.</li>}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}
