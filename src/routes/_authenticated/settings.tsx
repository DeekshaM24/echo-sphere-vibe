import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Avatar } from "@/components/app-shell";
import { Loader2, ImagePlus, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — EchoSpace" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUid(u.user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setProfile(p);
    })();
  }, []);

  async function save() {
    if (!uid || !profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          profession: profile.profession,
          avatar_url: profile.avatar_url,
          cover_url: profile.cover_url,
        })
        .eq("id", uid);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File, bucket: "avatars" | "covers", field: "avatar_url" | "cover_url") {
    if (!uid) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setProfile({ ...profile, [field]: data.publicUrl });
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete your account and all data?")) return;
    if (!uid) return;
    // Soft delete: remove profile and posts; auth.users requires admin to fully delete.
    await supabase.from("posts").delete().eq("author_id", uid);
    await supabase.from("profiles").delete().eq("id", uid);
    await supabase.auth.signOut();
    toast.success("Account data removed. Signing out.");
    navigate({ to: "/", replace: true });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="h-64 rounded-3xl skeleton" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Settings</h1>

      <section className="glass-panel mb-6 overflow-hidden rounded-3xl">
        <div className="relative h-40 bg-[image:var(--gradient-primary)]">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <label className="absolute right-3 top-3 cursor-pointer rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
            <ImagePlus className="mr-1 inline h-3 w-3" /> Cover
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "covers", "cover_url")}
            />
          </label>
        </div>
        <div className="-mt-12 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.username} size={96} />
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-[image:var(--gradient-primary)] p-1.5">
                <ImagePlus className="h-3 w-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatars", "avatar_url")}
                />
              </label>
            </div>
            <div className="pb-2">
              <div className="font-display text-xl font-bold">{profile.full_name ?? profile.username}</div>
              <div className="text-sm text-muted-foreground">@{profile.username}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel mb-6 space-y-4 rounded-3xl p-6">
        <h2 className="font-display text-lg font-bold">Edit profile</h2>
        <Input label="Full name" value={profile.full_name ?? ""} onChange={(v) => setProfile({ ...profile, full_name: v })} max={60} />
        <Input label="Bio" value={profile.bio ?? ""} onChange={(v) => setProfile({ ...profile, bio: v })} max={160} multiline />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Location" value={profile.location ?? ""} onChange={(v) => setProfile({ ...profile, location: v })} max={60} />
          <Input label="Profession" value={profile.profession ?? ""} onChange={(v) => setProfile({ ...profile, profession: v })} max={60} />
        </div>
        <Input label="Website" value={profile.website ?? ""} onChange={(v) => setProfile({ ...profile, website: v })} max={200} />
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Account</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <button
            onClick={deleteAccount}
            className="inline-flex items-center gap-2 rounded-full bg-destructive/20 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/30"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function Input({
  label,
  value,
  onChange,
  max,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={max}
          rows={3}
          className="w-full resize-none rounded-2xl border border-glass-border bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <input
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </label>
  );
}
