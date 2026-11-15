# tumbasmalih.com

Etalase kurasi barang & ebook, dengan checkout sendiri. Pembeli bayar di tumbasmalih
(QRIS / transfer / COD), lalu admin memesankan barang fisik ke marketplace di balik layar.
Ebook bisa diunduh dari halaman pesanan setelah pembayaran dikonfirmasi.

**Stack:** Next.js 16 (App Router, Cache Components) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel

## Fitur MVP (fase 1)

| Halaman | Isi |
|---|---|
| `/` | Beranda: hero, kategori, pilihan kurasi, ebook |
| `/kategori/[slug]`, `/cari?q=` | Daftar produk per kategori & pencarian |
| `/produk/[slug]` | Detail produk + data terstruktur (JSON-LD) untuk Google |
| `/keranjang`, `/checkout` | Keranjang (tersimpan di browser) & checkout |
| `/pesanan/[kode]` | Status pesanan, instruksi bayar, tombol WA, unduh ebook |
| `/admin` | Login admin, daftar & detail pesanan, ubah status/resi |
| `/admin/produk` | Tambah/edit produk, harga modal, link sumber marketplace |

Lainnya: `sitemap.xml`, `robots.txt`, metadata SEO per halaman, Meta Pixel
(PageView, ViewContent, AddToCart, InitiateCheckout, Purchase).

## Cara menjalankan

### 1. Siapkan Supabase
1. Buat project baru di [supabase.com](https://supabase.com) (region Singapore).
2. **SQL Editor** → jalankan isi `supabase/schema.sql`, lalu `supabase/seed.sql` (kategori awal). Produk ditambahkan dari `/admin/produk`.
3. **Authentication › Users** → *Add user* → buat akun admin (email + password).
4. **Project Settings › API** → salin URL, anon/publishable key, dan service_role/secret key.

### 2. Jalankan di komputer
```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev                  # buka http://localhost:3000
```

### 3. Deploy ke Vercel
1. Push folder ini ke GitHub, lalu *Import Project* di Vercel.
2. Isi semua variabel dari `.env.example` di **Settings › Environment Variables**.
3. Tambahkan domain `tumbasmalih.com` di **Settings › Domains** dan arahkan DNS sesuai petunjuk Vercel.
4. Daftarkan `https://tumbasmalih.com/sitemap.xml` di Google Search Console.

## Desain

Arahan visual ada di `DESIGN.md`. Kode diaudit dengan aturan [anti-slop](https://github.com/miqdadbadjuber/anti-slop); laporannya ada di folder `anti-slop/`.

Isi kebijakan toko di env `NEXT_PUBLIC_POLICY_SHIPPING`, `NEXT_PUBLIC_POLICY_RETURNS`, dan `NEXT_PUBLIC_POLICY_EBOOK`. Selama kosong, halaman menampilkan placeholder `[ISI ...]` supaya tidak ada janji yang dikarang.

## Alur kerja harian admin

1. Pesanan masuk → buka `/admin`.
2. **QRIS/Transfer:** setelah bukti bayar masuk lewat WA, ubah status ke *Sudah dibayar*.
   Untuk ebook, tombol **Unduh** otomatis muncul di halaman pesanan pembeli.
3. **Barang fisik:** klik *Pesan di marketplace ↗* di detail pesanan, pesankan dengan alamat pembeli,
   lalu isi nomor resi & ubah status ke *Dikirim*.
4. **COD:** status awal *Menunggu konfirmasi*; konfirmasi ke pembeli via WA, lalu proses seperti barang fisik.

### Menambah produk
- **Gambar:** unggah ke Storage bucket `produk` (publik), salin *public URL* ke kolom URL gambar.
- **File ebook:** unggah PDF ke bucket `ebooks` (privat), tulis path-nya (mis. `hemat-anak-kos.pdf`) di form produk.
  Link unduh dibuat sementara (10 menit) dan hanya untuk pesanan yang sudah dibayar.
- Kolom **harga modal** dan **link sumber** hanya terlihat di admin (dikunci di level database).

## Catatan keamanan
- Harga & total selalu dihitung ulang di server dari database; harga di keranjang browser hanya tampilan.
- Tabel `orders` tertutup untuk publik (RLS); hanya server dengan service role yang bisa membaca/menulis.
- `SUPABASE_SERVICE_ROLE_KEY` jangan pernah diberi awalan `NEXT_PUBLIC_`.

## Belum ada (rencana fase 2)
- Payment gateway otomatis (Midtrans/Xendit) supaya status *dibayar* & pengiriman ebook otomatis
- Ongkir real-time per kota (RajaOngkir / Biteship); sekarang masih flat `SHIPPING_FLAT`
- Pengurangan stok otomatis, notifikasi WA/email otomatis, upload gambar langsung dari admin
- Pembatasan spam di checkout (captcha / rate limit)
