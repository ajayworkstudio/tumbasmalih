-- Kategori awal. Produk ditambahkan lewat /admin/produk supaya semua harga dan deskripsi berasal dari kamu.

insert into public.categories (slug, name, icon, sort) values
  ('ebook', 'Ebook', 'book', 1),
  ('rumah-tangga', 'Rumah Tangga', 'home', 2),
  ('anak-kos', 'Anak Kos', 'key', 3),
  ('gadget', 'Gadget', 'phone', 4),
  ('fashion', 'Fashion', 'shirt', 5)
on conflict (slug) do nothing;
