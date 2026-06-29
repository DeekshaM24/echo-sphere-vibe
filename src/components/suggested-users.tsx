import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/app-shell";
import { BadgeCheck } from "lucide-react";

type Suggested = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean;
};

export function SuggestedUsers() {
  const [users, setUsers] = useState<Suggested[] | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setMe(u.user.id);
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", u.user.id);
      const followingIds = new Set((follows ?? []).map((f) => f.following_id));
      followingIds.add(u.user.id);

      const { data: ps } = await supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,verified")
        .order("created_at", { ascending: false })
        .limit(20);
      setUsers((ps ?? []).filter((p) => !followingIds.has(p.id)).slice(0, 5));
    })();
  }, []);

  async function toggle(id: string) {
    if (!me) return;
    const f = new Set(followed);
    if (f.has(id)) {
      f.delete(id);
      await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", id);
    } else {
      f.add(id);
      await supabase.from("follows").insert({ follower_id: me, following_id: id });
    }
    setFollowed(f);
  }

  if (!users) return null;
  if (users.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-5">
      <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Who to follow
      </h3>
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3">
            <Link to="/profile/$username" params={{ username: u.username }}>
              <Avatar src={u.avatar_url} name={u.full_name ?? u.username} size={40} />
            </Link>
            <Link
              to="/profile/$username"
              params={{ username: u.username }}
              className="min-w-0 flex-1"
            >
              <div className="flex items-center gap-1 truncate text-sm font-semibold">
                {u.full_name ?? u.username}
                {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-cyan" />}
              </div>
              <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
            </Link>
            <button
              onClick={() => toggle(u.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                followed.has(u.id)
                  ? "border border-glass-border text-muted-foreground"
                  : "bg-[image:var(--gradient-primary)] text-primary-foreground"
              }`}
            >
              {followed.has(u.id) ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
