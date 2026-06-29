import { useRef, useState } from "react";
import { ImagePlus, Loader2, Smile, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/app-shell";
import { toast } from "sonner";

export function Composer({
  currentUserId,
  avatarUrl,
  fullName,
  onCreated,
}: {
  currentUserId: string;
  avatarUrl: string | null;
  fullName: string | null;
  onCreated?: () => void;
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed && !file) return;
    if (trimmed.length > 2000) return toast.error("Too long");
    setLoading(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("posts").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("posts").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({
        content: trimmed || " ",
        image_url,
        author_id: currentUserId,
      });
      if (error) throw error;
      setContent("");
      pick(null);
      toast.success("Posted to the space");
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex gap-3">
        <Avatar src={avatarUrl} name={fullName} size={44} />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's echoing in your space?"
            rows={3}
            className="w-full resize-none bg-transparent text-[15px] placeholder:text-muted-foreground/70 focus:outline-none"
            maxLength={2000}
          />
          {preview && (
            <div className="relative mt-2 overflow-hidden rounded-2xl border border-glass-border">
              <img src={preview} alt="" className="max-h-80 w-full object-cover" />
              <button
                onClick={() => pick(null)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full p-2 text-cyan transition hover:bg-cyan/10"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + "✨")}
                className="rounded-full p-2 text-amber transition hover:bg-amber/10"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs tabular-nums ${content.length > 1800 ? "text-coral" : "text-muted-foreground"}`}>
                {content.length}/2000
              </span>
              <button
                onClick={submit}
                disabled={loading || (!content.trim() && !file)}
                className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
