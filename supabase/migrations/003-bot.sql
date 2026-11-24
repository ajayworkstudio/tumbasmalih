-- Log aksi bot Telegram (Akbar, Venya, Bulan). Jalankan sekali di Supabase › SQL Editor (aman dijalankan ulang).

create table if not exists public.bot_log (
  id bigint generated always as identity primary key,
  staff text not null check (staff in ('akbar', 'venya', 'bulan', 'sistem')),
  actor text not null,        -- ID Telegram yang memberi perintah, atau "cron"
  command text not null,
  result text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bot_log_created_idx on public.bot_log (created_at desc);

-- Hanya server (service role) yang boleh membaca dan menulis.
alter table public.bot_log enable row level security;
