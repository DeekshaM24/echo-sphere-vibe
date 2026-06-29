import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Avatar } from "@/components/app-shell";
import { PostCard, hydratePosts, type FeedPost } from "@/components/post-card";
import { BadgeCheck, MapPin, Link as LinkIcon, Briefcase, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — EchoSpace` }] }),
  component: Profile,
});

function Profile() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const myId = u.user?.id ?? null;
    setMe(myId);

    const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    if (!p) {
      setNotFound(true);
      return;
    }
    setProfile(p);

    const [{ count: fl }, { count: fg }, { data: postRows }, followRes] = await Promise.all([
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", p.id),
      supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", p.id),
      supabase
        .from("posts")
        .select("id,content,image_url,created_at,author_id")
        .eq("author_id", p.id)
        .order("created_at", { ascending: false })
        .limit(50),
      myId && myId !== p.id
        ? supabase.from("follows").select("follower_id").eq("follower_id", myId).eq("following_id", p.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setFollowers(fl ?? 0);
    setFollowing(fg ?? 0);
    setIsFollowing(Boolean(followRes.data));
    setPosts(await hydratePosts(postRows ?? [], myId));
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow() {
    if (!me || !profile) return;
    if (me === profile.id) return;
    if (isFollowing) {
      setIsFollowing(false);
      setFollowers((c) => c - 1);
      await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", profile.id);
    } else {
      setIsFollowing(true);
      setFollowers((c) => c + 1);
      await supabase.from("follows").insert({ follower_id: me, following_id: profile.id });
    }
  }

  if (notFound) {
    return (
      <AppShell>
        <div className="glass-panel rounded-3xl p-10 text-center">
          <h2 className="font-display text-2xl font-bold">User not found</h2>
          <p className="mt-2 text-muted-foreground">No profile for @{username}</p>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="h-64 rounded-3xl skeleton" />
      </AppShell>
    );
  }

  const isMe = me === profile.id;

  return (
    <AppShell>
      <section className="glass-panel mb-6 overflow-hidden rounded-3xl">
        <div className="relative h-48 bg-[image:var(--gradient-primary)] md:h-56">
          {profile.cover_url && <img src={profile.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="-mt-14 px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.username} size={112} />
            {isMe ? (
              <button
                onClick={() => navigate({ to: "/settings" })}
                className="rounded-full border border-glass-border bg-white/5 px-5 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  isFollowing
                    ? "border border-glass-border text-foreground hover:bg-destructive/20"
                    : "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold">{profile.full_name ?? profile.username}</h1>
            {profile.verified && <BadgeCheck className="h-5 w-5 text-cyan" />}
          </div>
          <div className="text-sm text-muted-foreground">@{profile.username}</div>
          {profile.bio && <p className="mt-3 max-w-2xl text-[15px]">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile.profession && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {profile.profession}
              </span>
            )}
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-cyan">
                <LinkIcon className="h-3 w-3" /> {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="mt-5 flex gap-6 text-sm">
            <div>
              <span className="font-display text-lg font-bold tabular-nums">{posts?.length ?? "—"}</span>
              <span className="ml-1 text-muted-foreground">posts</span>
            </div>
            <div>
              <span className="font-display text-lg font-bold tabular-nums">{followers}</span>
              <span className="ml-1 text-muted-foreground">followers</span>
            </div>
            <div>
              <span className="font-display text-lg font-bold tabular-nums">{following}</span>
              <span className="ml-1 text-muted-foreground">following</span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {!posts && <div className="h-32 rounded-2xl skeleton" />}
        {posts && posts.length === 0 && (
          <div className="glass-panel rounded-3xl p-10 text-center text-muted-foreground">
            No posts yet.
          </div>
        )}
        {posts?.map((p) => (
          <PostCard key={p.id} post={p} currentUserId={me} onDelete={(id) => setPosts((cur) => (cur ?? []).filter((x) => x.id !== id))} />
        ))}
      </div>
    </AppShell>
  );
}
