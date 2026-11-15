-- Data awal: kategori + beberapa produk CONTOH supaya tampilan langsung terisi.
-- Harga & deskripsi produk di bawah hanya contoh — ubah atau hapus lewat halaman /admin/produk.

insert into public.categories (slug, name, icon, sort) values
  ('ebook', 'Ebook', 'book', 1),
  ('rumah-tangga', 'Rumah Tangga', 'home', 2),
  ('anak-kos', 'Anak Kos', 'key', 3),
  ('gadget', 'Gadget', 'phone', 4),
  ('fashion', 'Fashion', 'shirt', 5),
  ('paket-kado', 'Paket & Kado', 'gift', 6)
on conflict (slug) do nothing;

insert into public.products (slug, name, description, type, category_id, price, compare_price, stock, is_featured)
select v.slug, v.name, v.description, v.type, c.id, v.price, v.compare_price, v.stock, v.is_featured
from (values
  ('ebook-panduan-hidup-hemat-anak-kos', 'Ebook Panduan Hidup Hemat Anak Kos',
   'Panduan praktis mengatur uang bulanan, masak hemat, dan belanja kebutuhan kos.',
   'ebook', 'ebook', 29000, 36000, null::int, true),
  ('ebook-meta-ads-untuk-umkm', 'Ebook Meta Ads untuk UMKM',
   'Langkah demi langkah memasang iklan Facebook & Instagram dengan budget kecil.',
   'ebook', 'ebook', 49000, null::int, null::int, true),
  ('rice-cooker-mini-0-8-l', 'Rice Cooker Mini 0,8 L',
   'Rice cooker ukuran kecil, pas untuk 1–2 orang.',
   'fisik', 'anak-kos', 189000, null::int, 8, true),
  ('rak-sepatu-susun-4', 'Rak Sepatu Susun 4',
   'Rak sepatu 4 tingkat, mudah dirakit tanpa alat.',
   'fisik', 'rumah-tangga', 75000, null::int, 15, false),
  ('lampu-belajar-led-lipat', 'Lampu Belajar LED Lipat',
   'Lampu meja LED yang bisa dilipat, 3 level terang.',
   'fisik', 'anak-kos', 68000, null::int, 11, true)
) as v(slug, name, description, type, category_slug, price, compare_price, stock, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
