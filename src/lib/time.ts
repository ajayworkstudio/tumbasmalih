const WIB = 7 * 3600_000;

/** Awal hari ini menurut jam WIB, dalam ISO UTC. */
export function todayStartWIB(): string {
  const wib = new Date(Date.now() + WIB);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB).toISOString();
}

/** Awal bulan ini menurut jam WIB, dalam ISO UTC. */
export function monthStartWIB(): string {
  const wib = new Date(Date.now() + WIB);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - WIB).toISOString();
}

export function hoursAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000);
}
