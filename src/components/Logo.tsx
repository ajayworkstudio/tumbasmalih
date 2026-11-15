import Link from "next/link";

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={`font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"} ${className}`}>
      tumbas<span className={dark ? "text-accent" : "text-brand"}>malih</span>
    </Link>
  );
}
