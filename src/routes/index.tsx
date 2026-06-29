import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, ArrowRight, Heart, MessageCircle, Users, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EchoSpace — A social space for your ideas" },
      { name: "description", content: "Connect, share, and discover creators on EchoSpace — a modern social platform with a cosmic soul." },
      { property: "og:title", content: "EchoSpace" },
      { property: "og:description", content: "Where ideas echo into space. A modern, beautiful social network." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/feed", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen aurora-bg">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold">
            Echo<span className="gradient-text">Space</span>
          </span>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-white/5 px-5 py-2 text-sm font-semibold ring-1 ring-glass-border transition hover:bg-white/10"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center md:pt-20">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
          New · v1.0 launching today
        </div>
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold leading-[1.05] md:text-7xl">
          A social space where <br className="hidden md:block" />
          <span className="gradient-text">every voice echoes.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          EchoSpace is a modern social network for creators, thinkers, and dreamers. Share posts,
          follow people who matter, and build something beautiful.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02]"
          >
            Get started — free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full glass-panel px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            Explore the feed
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">
        {[
          { i: Heart, t: "Bold reactions", d: "Show love with animated likes and saves that feel tactile." },
          { i: MessageCircle, t: "Real conversations", d: "Comments and mentions that actually surface to the people who care." },
          { i: Users, t: "Build your tribe", d: "Follow creators, grow followers, and watch your circle expand." },
          { i: Compass, t: "Discover the new", d: "An explore feed tuned for serendipity, not noise." },
          { i: Sparkles, t: "Designed beautifully", d: "Glass, gradients, and motion. A product that feels alive." },
          { i: ArrowRight, t: "Zero friction", d: "Sign up in seconds. No setup. Just start sharing." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="glass-panel rounded-3xl p-6 transition hover:translate-y-[-4px] hover:bg-white/10">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display text-lg font-bold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-glass-border py-8 text-center text-xs text-muted-foreground">
        EchoSpace · Built for the CodeAlpha internship · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
