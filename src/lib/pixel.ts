// Pembantu Meta Pixel. Aman dipanggil walau pixel belum dipasang.
type Fbq = (action: "track", event: string, params?: Record<string, unknown>) => void;

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params);
}
