import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { requireAdmin } from "@/lib/auth";
import type { Settings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Pengaturan | Admin" };

async function SettingsLoader() {
  await requireAdmin();
  // Dibaca langsung (tanpa cache) supaya form selalu menampilkan nilai terbaru.
  const { data, error } = await createAdminClient().from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Gagal memuat pengaturan: ${error.message}. Pastikan schema.sql terbaru sudah dijalankan.`);
  const settings: Settings = {
    whatsapp: data?.whatsapp ?? "",
    bankAccounts: Array.isArray(data?.bank_accounts) ? data.bank_accounts : [],
    qrisImageUrl: data?.qris_image_url ?? "",
    shippingFlat: data?.shipping_flat ?? 15000,
    policyShipping: data?.policy_shipping ?? "",
    policyReturns: data?.policy_returns ?? "",
    policyEbook: data?.policy_ebook ?? "",
  };
  return <SettingsForm settings={settings} />;
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Pengaturan toko</h1>
        <p className="text-sm text-muted">Perubahan di sini langsung dipakai di toko, tanpa deploy ulang.</p>
      </div>
      <Suspense fallback={<BlockSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
