-- Skema database tumbasmalih.
-- Jalankan sekali di Supabase: Dashboard › SQL Editor › New query › tempel › Run.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- ikon yang dikenal frontend: book, home, key, phone, shirt, gift, bag
  icon text not null default 'bag',
  sort integer not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  type text not null check (type in ('ebook', 'fisik')),
  category_id uuid references public.categories (id) on delete set null,
  price integer not null check (price >= 0),          -- harga jual (rupiah)
  compare_price integer check (compare_price >= 0),   -- harga coret, opsional
  image_url text,
  stock integer check (stock >= 0),                    -- null = tidak dibatasi
  is_active boolean not null default true,
  is_featured boolean not null default false,
  -- Kolom internal, tidak bisa dibaca publik:
  file_path text,       -- path file ebook di bucket privat "ebooks"
  source_url text,      -- link produk di marketplace untuk dipesankan
  source_price integer, -- harga modal di marketplace
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active, is_featured);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  phone text not null,
  email text not null,
  address text,
  city text,
  postal_code text,
  note text,
  payment_method text not null check (payment_method in ('qris', 'transfer', 'cod')),
  status text not null default 'menunggu_pembayaran' check (status in (
    'menunggu_pembayaran', 'menunggu_konfirmasi', 'dibayar', 'diproses',
    'dikirim', 'selesai', 'dibatalkan'
  )),
  subtotal integer not null,
  shipping_fee integer not null default 0,
  total integer not null,
  tracking_number text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  type text not null check (type in ('ebook', 'fisik')),
  price integer not null,
  qty integer not null check (qty > 0),
  line_total integer not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),  -- hanya satu baris
  whatsapp text not null default '',                 -- format 62xxxxxxxxxx
  bank_accounts jsonb not null default '[]',         -- [{"bank","number","holder"}]
  qris_image_url text not null default '',
  shipping_flat integer not null default 15000 check (shipping_flat >= 0),
  policy_shipping text not null default '',
  policy_returns text not null default '',
  policy_ebook text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Publik hanya bisa membaca kategori dan produk aktif.
-- Pesanan hanya diakses server lewat service role (tanpa policy = tertutup untuk publik).
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

drop policy if exists "kategori publik" on public.categories;
create policy "kategori publik" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "produk aktif publik" on public.products;
create policy "produk aktif publik" on public.products
  for select to anon, authenticated using (is_active);

-- Pengaturan toko (WA, rekening, kebijakan) memang ditampilkan ke pembeli, jadi boleh dibaca publik.
drop policy if exists "pengaturan publik" on public.settings;
create policy "pengaturan publik" on public.settings
  for select to anon, authenticated using (true);

grant select on public.categories, public.settings to anon, authenticated;

-- Sembunyikan kolom internal (harga modal, link sumber, path file ebook) dari publik.
revoke select on public.products from anon, authenticated;
grant select (
  id, slug, name, description, type, category_id, price, compare_price,
  image_url, stock, is_active, is_featured, created_at
) on public.products to anon, authenticated;

-- "produk" untuk gambar produk (publik). "ebooks" untuk file ebook (privat, diunduh lewat link bertanda tangan).
insert into storage.buckets (id, name, public)
values ('produk', 'produk', true), ('ebooks', 'ebooks', false)
on conflict (id) do nothing;
