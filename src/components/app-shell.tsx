import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Bell, Bookmark, User as UserIcon, LayoutDashboard, Settings, Search, LogOut, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; params?: Record<string, string> };

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [me, setMe] = useState<{ username: string; full_name: string | null; avatar_url: string | null } | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !alive) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("username,full_name,avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      if (alive && p) setMe(p);
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.user.id)
        .eq("read", false);
      if (alive) setUnread(count ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  const items: NavItem[] = [
    { to: "/feed", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/search", label: "Search", icon: Search },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen aurora-bg">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col gap-2 md:flex">
          <Link to="/feed" className="mb-4 flex items-center gap-2 px-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight">
              Echo<span className="gradient-text">Space</span>
            </span>
          </Link>
          <nav className="glass-panel flex flex-1 flex-col gap-1 rounded-3xl p-3">
            {items.map((it) => {
              const active = pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "text-foreground/80 hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{it.label}</span>
                  {it.to === "/notifications" && unread > 0 && (
                    <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-auto flex flex-col gap-2 border-t border-glass-border pt-3">
              {me && (
                <Link
                  to="/profile/$username"
                  params={{ username: me.username }}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white/5"
                >
                  <Avatar src={me.avatar_url} name={me.full_name ?? me.username} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{me.full_name ?? me.username}</div>
                    <div className="truncate text-xs text-muted-foreground">@{me.username}</div>
                  </div>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-2xl px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass-panel fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-full p-2 md:hidden">
        {[
          { to: "/feed", icon: Home },
          { to: "/explore", icon: Compass },
          { to: "/search", icon: Search },
          { to: "/notifications", icon: Bell },
          { to: me ? `/profile/${me.username}` : "/dashboard", icon: UserIcon, isProfile: true },
        ].map((it, i) => {
          const active = pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={i}
              to={it.to as string}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full transition",
                active ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "text-foreground/70",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const init = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground ring-1 ring-glass-border"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span>{init}</span>
      )}
    </div>
  );
}
