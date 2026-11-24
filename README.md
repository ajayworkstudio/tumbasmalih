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
| `/admin` | Ringkasan: pesanan yang perlu tindakan, omzet bulan ini, stok hampir habis |
| `/admin/pesanan` | Daftar & detail pesanan, ubah status/resi, link sumber marketplace |
| `/admin/produk` | Tambah/edit produk, upload foto & file ebook langsung, harga modal |
| `/admin/kategori` | Tambah, ubah, hapus kategori |
| `/admin/pengaturan` | Nomor WhatsApp, rekening, gambar QRIS, ongkir flat, kebijakan toko |

Lainnya: `sitemap.xml`, `robots.txt`, metadata SEO per halaman, Meta Pixel
(PageView, ViewContent, AddToCart, InitiateCheckout, Purchase).

## Cara menjalankan

### 1. Siapkan Supabase
1. Buat project baru di [supabase.com](https://supabase.com) (region Singapore).
2. **SQL Editor** → jalankan isi `supabase/schema.sql`, lalu `supabase/seed.sql` (kategori awal). Produk ditambahkan dari `/admin/produk`.
3. **Authentication › Users** → *Add user* → *Create new user* → isi email admin dan password, centang *Auto Confirm User*. Email yang sama dimasukkan ke env `ADMIN_EMAILS`.
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

## Bot Telegram: Akbar, Venya, Bulan

Tiga "karyawan" bot yang kamu perintah dari Telegram:

| Perintah | Karyawan | Contoh |
|---|---|---|
| `/akbar` | Administrasi: pesanan, pembayaran, resi, rekap | `/akbar`, `/akbar cek TM7K2QXPRA`, `/akbar bayar TM7K2QXPRA`, `/akbar kirim TM7K2QXPRA JP123`, `/akbar rekap bulan`, `/akbar ingatkan` |
| `/bulan` | Inventori: stok, harga modal, pesan ke marketplace | `/bulan`, `/bulan pesan`, `/bulan stok rak-sepatu 12`, `/bulan modal rak-sepatu 72000`, `/bulan margin`, `/bulan sembunyikan rak-sepatu` |
| `/venya` | Marketing: produk laris, draf caption & iklan | `/venya laris`, `/venya caption rice-cooker`, `/venya iklan rice-cooker`, `/venya ide` |

Aksi yang mengubah uang atau tampilan toko (tandai dibayar, batalkan, sembunyikan produk) selalu minta konfirmasi lewat tombol. Pesanan baru otomatis dikabarkan Akbar, dan setiap pukul 07.00 WIB Akbar dan Bulan mengirim laporan pagi. Semua aksi tercatat di tabel `bot_log`.

**Setup sekali:**
1. Di Telegram, chat **@BotFather** → `/newbot` → beri nama (misal *Kantor tumbasmalih*) → salin token.
2. Jalankan `supabase/migrations/003-bot.sql` di SQL Editor Supabase.
3. Di Vercel › Environment Variables isi `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (string acak 20+ huruf/angka), `CRON_SECRET` (string acak), lalu Redeploy. Pastikan `NEXT_PUBLIC_SITE_URL` berisi alamat https toko.
4. Buka `/admin/pengaturan` › **Hubungkan bot**.
5. Kirim `/start` ke bot. Bot membalas ID Telegram kamu. Isi `TELEGRAM_ALLOWED_IDS` dengan ID itu, lalu Redeploy lagi. Setelah itu kirim `/bantuan` ke bot.
6. Opsional: supaya Venya menulis draf caption dan iklan dengan AI, buat API key gratis di [console.groq.com/keys](https://console.groq.com/keys), isi `GROQ_API_KEY` di Vercel, lalu Redeploy. Tanpa key, Venya memberi template.
   - Model default `openai/gpt-oss-120b`. Ganti lewat `AI_MODEL` kalau Groq memensiunkan model ini.
   - Paket gratis Groq dibatasi per menit dan per hari. Kalau kuota habis, Venya memberi template dan kamu bisa coba lagi nanti.
   - Bisa juga memakai `GEMINI_API_KEY` atau `ANTHROPIC_API_KEY`. Kalau lebih dari satu key terisi, pilih dengan `AI_PROVIDER`.

Untuk tim di grup: buat grup Telegram, masukkan bot, isi `TELEGRAM_NOTIFY_CHAT_ID` dengan ID grup, dan tambahkan ID setiap anggota ke `TELEGRAM_ALLOWED_IDS`.

## Migrasi database

Database lama menjalankan file di `supabase/migrations/` yang belum pernah dijalankan, berurutan: `002-galeri-foto.sql`, `003-bot.sql`. Database baru cukup memakai `schema.sql`.

## Desain

Arahan visual ada di `DESIGN.md`. Kode diaudit dengan aturan [anti-slop](https://github.com/miqdadbadjuber/anti-slop); laporannya ada di folder `anti-slop/`.

Nomor WhatsApp, rekening, QRIS, ongkir, dan kebijakan toko diisi dari `/admin/pengaturan`. Selama kebijakan kosong, halaman menampilkan placeholder `[ISI ...]` supaya tidak ada janji yang dikarang.

## Alur kerja harian admin

1. Pesanan masuk → buka `/admin`.
2. **QRIS/Transfer:** setelah bukti bayar masuk lewat WA, ubah status ke *Sudah dibayar*.
   Untuk ebook, tombol **Unduh** otomatis muncul di halaman pesanan pembeli.
3. **Barang fisik:** klik *Pesan di marketplace ↗* di detail pesanan, pesankan dengan alamat pembeli,
   lalu isi nomor resi & ubah status ke *Dikirim*.
4. **COD:** status awal *Menunggu konfirmasi*; konfirmasi ke pembeli via WA, lalu proses seperti barang fisik.

### Masuk admin
- Buka `/admin` atau tautan **Masuk admin** di footer toko.
- Selama login, halaman produk di toko menampilkan tombol **Edit produk ini (admin)**.

### Menambah produk
- Satu produk bisa punya sampai 8 foto (pilih beberapa sekaligus, atur urutan, foto pertama jadi sampul). Foto masuk bucket publik `produk`, file ebook masuk bucket privat `ebooks`.
- Link unduh ebook dibuat sementara (10 menit) dan hanya untuk pesanan yang sudah dibayar.
- Kolom **harga modal** dan **link sumber** hanya terlihat di admin (dikunci di level database).

## Catatan keamanan
- Harga & total selalu dihitung ulang di server dari database; harga di keranjang browser hanya tampilan.
- Tabel `orders` tertutup untuk publik (RLS); hanya server dengan service role yang bisa membaca/menulis.
- `SUPABASE_SERVICE_ROLE_KEY` jangan pernah diberi awalan `NEXT_PUBLIC_`.

## Belum ada (rencana fase 2)
- Payment gateway otomatis (Midtrans/Xendit) supaya status *dibayar* & pengiriman ebook otomatis
- Ongkir real-time per kota (RajaOngkir / Biteship); sekarang masih flat `SHIPPING_FLAT`
- Pengurangan stok otomatis, notifikasi WA/email otomatis
- Pembatasan spam di checkout (captcha / rate limit)
