import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Sparkles, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EchoSpace" },
      { name: "description", content: "Join EchoSpace. Connect, share, and discover creators." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(24)
    .regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscores"),
  full_name: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/feed", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/feed`,
            data: { username: parsed.data.username, full_name: parsed.data.full_name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to EchoSpace");
        navigate({ to: "/feed", replace: true });
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: "/feed", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/feed", replace: true });
  }

  return (
    <div className="min-h-screen aurora-bg">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 md:grid-cols-2 md:items-center">
        {/* Hero */}
        <div className="hidden flex-col gap-8 md:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-3xl font-extrabold">
              Echo<span className="gradient-text">Space</span>
            </span>
          </Link>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05]">
            Where ideas <br />
            <span className="gradient-text">echo into space.</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Share moments, follow creators, and build your corner of the universe. A modern social
            network designed to feel alive.
          </p>
          <div className="glass-panel grid grid-cols-3 gap-4 rounded-3xl p-5">
            {[
              { k: "Posts", v: "Infinite" },
              { k: "Vibes", v: "Cosmic" },
              { k: "Friction", v: "Zero" },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-display text-2xl font-bold gradient-text">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="glass-panel mx-auto w-full max-w-md rounded-3xl p-8 shadow-[var(--shadow-elegant)]">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-primary)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-2xl font-extrabold">
              Echo<span className="gradient-text">Space</span>
            </span>
          </div>

          <div className="mb-2 inline-flex rounded-full bg-white/5 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signin" ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signup" ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold">
            {mode === "signin" ? "Welcome back" : "Join the space"}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue your journey." : "Free forever. No credit card."}
          </p>

          <button
            onClick={google}
            type="button"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-glass-border bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v2.93h5.36a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.98-4.32 2.98-7.39 0-.7-.06-1.39-.22-2.06Z"/><path fill="#fff" opacity=".75" d="M12 22c2.7 0 4.97-.9 6.62-2.45l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#fff" opacity=".55" d="M6.42 13.89A6 6 0 0 1 6.42 10.1V7.51H3.07a10 10 0 0 0 0 8.97l3.35-2.59Z"/><path fill="#fff" opacity=".35" d="M12 5.95c1.47 0 2.78.5 3.81 1.49l2.86-2.86C16.96 2.99 14.7 2 12 2A10 10 0 0 0 3.07 7.51l3.35 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg>
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-glass-border" /> or <div className="h-px flex-1 bg-glass-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={<UserIcon className="h-4 w-4" />} placeholder="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v.toLowerCase() })} />
                <Field placeholder="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              </>
            )}
            <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to the EchoSpace community guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  ...props
}: {
  icon?: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-white/5 px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <input
        className="w-full bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}
