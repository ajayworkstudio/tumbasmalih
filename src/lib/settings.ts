import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { hasSupabaseEnv } from "./supabase/env";
import { site } from "./site";

export type BankAccount = { bank: string; number: string; holder: string };

export type Settings = {
  whatsapp: string;
  bankAccounts: BankAccount[];
  qrisImageUrl: string;
  shippingFlat: number;
  policyShipping: string;
  policyReturns: string;
  policyEbook: string;
};

const EMPTY: Settings = {
  whatsapp: site.whatsappFallback,
  bankAccounts: [],
  qrisImageUrl: "",
  shippingFlat: 15000,
  policyShipping: "",
  policyReturns: "",
  policyEbook: "",
};

type Row = {
  whatsapp: string;
  bank_accounts: unknown;
  qris_image_url: string;
  shipping_flat: number;
  policy_shipping: string;
  policy_returns: string;
  policy_ebook: string;
};

function parseBanks(value: unknown): BankAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((b) => ({ bank: String(b?.bank ?? "").trim(), number: String(b?.number ?? "").trim(), holder: String(b?.holder ?? "").trim() }))
    .filter((b) => b.bank && b.number && b.holder);
}

/** Pengaturan toko yang diubah dari /admin/pengaturan. */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  if (!hasSupabaseEnv()) return EMPTY;
  const { data, error } = await createPublicClient()
    .from("settings")
    .select("whatsapp, bank_accounts, qris_image_url, shipping_flat, policy_shipping, policy_returns, policy_ebook")
    .eq("id", 1)
    .maybeSingle<Row>();
  if (error) throw new Error(`Gagal memuat pengaturan toko: ${error.message}`);
  if (!data) return EMPTY;
  return {
    whatsapp: data.whatsapp || site.whatsappFallback,
    bankAccounts: parseBanks(data.bank_accounts),
    qrisImageUrl: data.qris_image_url,
    shippingFlat: data.shipping_flat,
    policyShipping: data.policy_shipping,
    policyReturns: data.policy_returns,
    policyEbook: data.policy_ebook,
  };
}
