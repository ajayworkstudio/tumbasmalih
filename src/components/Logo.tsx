import Link from "next/link";

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={`inline-flex min-h-11 items-center font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"} ${className}`}>
      tumbas<span className={dark ? "marker-tag" : "marker"}>malih</span>
    </Link>
  );
}
