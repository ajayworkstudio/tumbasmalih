import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAID = ["dibayar", "diproses", "dikirim", "selesai"];

/** Membuat link unduh sementara (10 menit) untuk ebook di pesanan yang sudah dibayar. */
export async function GET(_req: Request, ctx: RouteContext<"/api/unduh/[kode]/[itemId]">) {
  const { kode, itemId } = await ctx.params;
  if (!/^TM[0-9A-Z]{8}$/.test(kode) || !/^[0-9a-f-]{36}$/i.test(itemId)) {
    return new NextResponse("Link tidak valid.", { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("id, status").eq("code", kode).maybeSingle();
  if (!order) return new NextResponse("Pesanan tidak ditemukan.", { status: 404 });
  if (!PAID.includes(order.status)) {
    return new NextResponse("Pembayaran belum dikonfirmasi.", { status: 403 });
  }

  const { data: item } = await supabase
    .from("order_items")
    .select("product_id, type")
    .eq("id", itemId)
    .eq("order_id", order.id)
    .maybeSingle();
  if (!item || item.type !== "ebook" || !item.product_id) {
    return new NextResponse("Ebook tidak ditemukan di pesanan ini.", { status: 404 });
  }

  const { data: product } = await supabase.from("products").select("file_path").eq("id", item.product_id).maybeSingle();
  if (!product?.file_path) {
    return new NextResponse("File ebook belum tersedia. Hubungi admin lewat WhatsApp.", { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(product.file_path, 600, { download: true });
  if (error || !signed) {
    console.error("unduh:", error?.message);
    return new NextResponse("Gagal membuat link unduh. Coba lagi.", { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
