"use client";
import { useId, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { createUploadTicket } from "../actions";

type Props = {
  /** "produk" untuk gambar (publik), "ebooks" untuk file ebook (privat). */
  bucket: "produk" | "ebooks";
  /** Nama field yang dikirim bersama form: URL publik untuk gambar, path untuk ebook. */
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
};

export function Uploader({ bucket, name, label, hint, defaultValue = "" }: Props) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");
  const isImage = bucket === "produk";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("uploading");
    setMessage(`Mengunggah ${file.name}…`);
    const ticket = await createUploadTicket(bucket, file.name);
    if (ticket.error || !ticket.path || !ticket.token) {
      setStatus("error");
      setMessage(ticket.error ?? "Gagal menyiapkan upload.");
      return;
    }
    const { error } = await createBrowserSupabase().storage.from(bucket).uploadToSignedUrl(ticket.path, ticket.token, file);
    if (error) {
      setStatus("error");
      setMessage(`Upload gagal: ${error.message}`);
      return;
    }
    setValue(isImage ? (ticket.publicUrl ?? "") : ticket.path);
    setStatus("idle");
    setMessage(`${file.name} terunggah. Jangan lupa simpan.`);
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-field bg-white p-3">
        {value && isImage && (
          <img src={value} alt="Pratinjau gambar" width={64} height={64} className="size-16 rounded-lg border border-line object-cover" />
        )}
        {value && !isImage && <span className="min-w-0 flex-1 truncate font-medium">{value}</span>}
        {!value && <span className="flex-1 text-muted">Belum ada file.</span>}
        <label
          htmlFor={inputId}
          className="flex h-11 items-center rounded-lg border border-field px-4 font-bold text-brand hover:border-brand hover:bg-brand-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
        >
          {value ? "Ganti file" : "Pilih file"}
          <input
            id={inputId}
            type="file"
            accept={isImage ? "image/jpeg,image/png,image/webp" : "application/pdf,application/epub+zip"}
            onChange={onFile}
            disabled={status === "uploading"}
            className="sr-only"
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setMessage("File dilepas dari form. Simpan untuk menerapkan.");
            }}
            className="h-11 rounded-lg px-3 font-semibold text-muted hover:bg-[#FDECEC] hover:text-danger"
          >
            Lepas
          </button>
        )}
      </div>
      <span role="status" className={`text-xs ${status === "error" ? "font-medium text-danger" : "text-muted"}`}>
        {message || hint}
      </span>
    </div>
  );
}
