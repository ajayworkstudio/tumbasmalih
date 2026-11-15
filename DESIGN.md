# DESIGN.md: tumbasmalih

Status: draf yang disusun dari referensi tampilan mobile yang dikirim pemilik (kartu produk dengan label harga, chip kategori, bar keranjang melayang). Ubah bagian mana pun yang tidak sesuai; agent membaca file ini sebagai arahan desain, lalu `anti-slop` sebagai filter.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

Design Read: etalase belanja kurasi untuk pembeli di Jawa Tengah dan sekitarnya yang belanja dari HP, gaya katalog terang yang ramah, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## Identitas

- **Nama:** tumbasmalih, dari bahasa Jawa: *tumbas* (beli) dan *malih* (lagi). Ajakan untuk kembali belanja.
- **Kepribadian:** seperti teman yang sudah memilihkan barang: ramah, langsung, tidak berlebihan.
- **Janji yang boleh diucapkan:** barang dipilih sendiri, bayar lewat QRIS/transfer/COD, admin membalas di WhatsApp. Janji lain (hemat, cepat, promo) hanya jika ada datanya.

## Motif identitas

Stabilo kuning di bawah satu kata kunci per layar (`.marker` di latar terang, `.marker-tag` di latar gelap). Dipakai di logo ("malih"), H1 beranda ("tumbas"), dan judul "Kenapa tumbas di sini?". Alasan: mengangkat kata Jawa di nama merek dan memberi tanda yang dikenali tanpa logo bergambar.

## Warna

| Token | Nilai | Alasan |
|---|---|---|
| `brand` | #1F4FE0 | Warna utama dari referensi; dipakai untuk aksi utama, label harga, dan blok hero. Kontras 6,46:1 dengan putih. |
| `navy` | #0F1B3D | Latar footer, penutup halaman yang tenang. |
| `accent` | #FFD23F | Satu aksen: tombol aksi di hero dan motif stabilo. Tidak dipakai di tombol kartu produk. |
| `ink` / `muted` | #111827 / #5B6474 | Teks utama dan teks pendukung (5,97:1 di putih). |
| `field` | #7C8799 | Garis input dan kontrol (3,63:1 di putih, lolos batas 3:1 non-teks). |
| `brand-tint` / `accent-tint` | #E7EEFF / #FFF1D6 | Latar placeholder gambar ebook dan barang fisik, turunan dari dua warna inti. |
| Status | ok #1F7A4D, warn #B4410C, danger #B42318, wa #147A3E | Hanya untuk status (sukses, stok, error) dan tombol WhatsApp. |

Palet inti: biru + navy, satu aksen kuning. Warna status tidak dipakai sebagai hiasan.

## Tipografi

Plus Jakarta Sans (self-host lewat `@fontsource-variable`). Alasan: dirancang untuk identitas kota Jakarta, terasa lokal Indonesia, dan angka serta huruf kecilnya tetap jelas di ukuran kecil, penting untuk harga dan label stok di layar HP. Satu keluarga huruf, hierarki dari ketebalan (600 sampai 800) dan ukuran.

## Bentuk

- Radius bertingkat sebagai hierarki: input 8px, tombol 12px, kartu produk 18 sampai 20px, blok hero 24px, chip kategori 16px. Bentuk bulat penuh hanya untuk tombol ikon keranjang, penanda jumlah, dan label status di admin.
- Bayangan hanya untuk bar keranjang melayang (penanda elevasi di atas konten).
- Tanpa gradien, glow, glassmorphism, atau pola latar.

## Ikon

Set ikon garis 2px buatan sendiri di `src/components/Icon.tsx`. Alasan: garis tebal tetap terbaca di ukuran 18 sampai 22px, dan setiap ikon dipetakan ke artinya (buku untuk ebook, tas untuk barang fisik, truk untuk pengiriman, QR untuk QRIS). Tidak ada ikon hiasan tanpa arti.

## Tata letak

- Mobile dulu: lebar 360 sampai 430px, navigasi bawah, bar keranjang melayang di atas navigasi.
- Beranda tidak seragam: hero dua kolom, chip kategori yang bisa digeser, grid kartu untuk pilihan kurasi, daftar baris untuk ebook, dan daftar bernomor untuk alasan belanja.
- Target sentuh minimal 44px.

## Tema

Terang saja. Alasan: referensi pemilik terang, foto produk dan label harga paling jelas di latar terang, dan toko ini tidak punya alasan merek untuk mode gelap. Tinjau ulang kalau pembeli memintanya.

## Gerak

MOTION 1: hanya state hover, active (tombol turun 1px), dan fokus. Skeleton memuat berdenyut, dan semua animasi berhenti saat `prefers-reduced-motion`.

## Suara dan teks

- Bahasa Indonesia santai dengan sapaan "kamu"; kata Jawa dipakai secukupnya (tumbas).
- Tidak ada angka, testimoni, promo, atau kebijakan yang belum nyata. Kebijakan kirim dan retur diisi lewat env `NEXT_PUBLIC_POLICY_*`; selama kosong tampil placeholder `[ISI ...]`.
- Tanpa em dash. Tombol menyebut aksinya ("Buat pesanan", "Lihat pilihan kurasi").
