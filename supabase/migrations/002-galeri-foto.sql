-- Galeri foto produk. Jalankan sekali di Supabase › SQL Editor (aman dijalankan ulang).
-- Hanya untuk database yang dibuat sebelum fitur galeri; schema.sql terbaru sudah memuat ini.

alter table public.products add column if not exists images text[] not null default '{}';

-- Produk lama: foto sampul yang sudah ada jadi foto pertama di galeri.
update public.products
set images = array[image_url]
where image_url is not null and cardinality(images) = 0;

grant select (images) on public.products to anon, authenticated;

-- Minta API Supabase membaca ulang struktur tabel.
notify pgrst, 'reload schema';
