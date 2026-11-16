"use client";
import { useId, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { createUploadTicket } from "../actions";

export const MAX_IMAGES = 8;

/** Upload beberapa foto produk sekaligus. Foto pertama jadi sampul di kartu produk. */
export function GalleryUploader({ defaultValue = [] }: { defaultValue?: string[] }) {
  const inputId = useId();
  const [images, setImages] = useState<string[]>(defaultValue.slice(0, MAX_IMAGES));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const room = MAX_IMAGES - images.length;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const picked = files.slice(0, room);
    setBusy(true);
    setIsError(false);
    const supabase = createBrowserSupabase();
    const uploaded: string[] = [];
    const failed: string[] = [];
    for (const [i, file] of picked.entries()) {
      setMessage(`Mengunggah ${i + 1} dari ${picked.length}: ${file.name}…`);
      const ticket = await createUploadTicket("produk", file.name);
      if (ticket.error || !ticket.path || !ticket.token || !ticket.publicUrl) {
        failed.push(`${file.name} (${ticket.error ?? "gagal menyiapkan upload"})`);
        continue;
      }
      const { error } = await supabase.storage.from("produk").uploadToSignedUrl(ticket.path, ticket.token, file);
      if (error) failed.push(`${file.name} (${error.message})`);
      else uploaded.push(ticket.publicUrl);
    }
    setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
    setBusy(false);
    const skipped = files.length - picked.length;
    const parts = [
      uploaded.length && `${uploaded.length} foto terunggah. Jangan lupa simpan produk.`,
      failed.length && `Gagal: ${failed.join(", ")}.`,
      skipped > 0 && `${skipped} foto dilewati karena batas ${MAX_IMAGES} foto.`,
    ].filter(Boolean);
    setIsError(failed.length > 0 && uploaded.length === 0);
    setMessage(parts.join(" "));
  }

  function move(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  const btn = "flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-bold hover:bg-brand-soft disabled:opacity-40";

  return (
    <fieldset className="flex flex-col gap-2 text-sm">
      <legend className="mb-1.5 font-semibold">
        Foto produk <span className="font-normal text-muted">({images.length}/{MAX_IMAGES}, foto pertama jadi sampul)</span>
      </legend>
      {images.map((src) => (
        <input key={src} type="hidden" name="images" value={src} />
      ))}
      {images.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src} className="flex flex-col gap-1 rounded-xl border border-line bg-white p-2">
              <div className="relative">
                <img src={src} alt={`Foto ${i + 1}`} width={160} height={160} className="aspect-square w-full rounded-lg object-cover" />
                {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Sampul</span>}
              </div>
              <div className="flex flex-wrap items-center justify-between">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Geser foto ${i + 1} ke kiri`} className={`${btn} text-brand`}>
                  ‹
                </button>
                {i > 0 && (
                  <button type="button" onClick={() => move(i, 0)} className={`${btn} text-brand`}>
                    Sampul
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label={`Geser foto ${i + 1} ke kanan`}
                  className={`${btn} text-brand`}
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Hapus foto ${i + 1}`}
                  className={`${btn} text-danger hover:bg-[#FDECEC]`}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          aria-disabled={busy || room === 0}
          className={`flex h-11 items-center rounded-lg border border-field bg-white px-4 font-bold text-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
            busy || room === 0 ? "cursor-not-allowed opacity-50" : "hover:border-brand hover:bg-brand-soft"
          }`}
        >
          {busy ? "Mengunggah…" : images.length ? "Tambah foto" : "Pilih foto"}
          <input
            id={inputId}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onFiles}
            disabled={busy || room === 0}
            className="sr-only"
          />
        </label>
        <span className="text-xs text-muted">JPG, PNG, atau WEBP. Bisa pilih beberapa sekaligus. Foto persegi paling rapi.</span>
      </div>
      {message && (
        <span role="status" className={`text-xs ${isError ? "font-medium text-danger" : "text-muted"}`}>
          {message}
        </span>
      )}
    </fieldset>
  );
}
