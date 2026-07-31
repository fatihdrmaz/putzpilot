-- PutzPilot — initial schema (PRD v4, Bölüm 14)
-- Tablolar + RLS + open_jobs (maskelenmiş adres) view

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('customer', 'cleaner', 'admin');
create type cleaning_type as enum ('normal', 'tasinma', 'insaat');
create type booking_status as enum (
  'draft', 'pending_payment', 'open', 'assigned',
  'in_progress', 'completed', 'cancelled'
);
create type verification_status as enum ('pending', 'approved', 'rejected');
create type payer_role as enum ('customer', 'cleaner');
create type payment_type as enum ('prepayment', 'reservation_fee', 'refund');
create type payment_status as enum ('created', 'completed', 'failed', 'refunded');
create type job_event_type as enum ('started', 'completed', 'gps_fail');
create type message_direction as enum ('in', 'out');

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'customer',
  first_name  text,
  last_name   text,
  phone       text,
  email       text,
  language    text not null default 'de',
  created_at  timestamptz not null default now()
);

create table cleaner_profiles (
  user_id                 uuid primary key references profiles (id) on delete cascade,
  photo_url               text,
  id_document_path        text,
  residence_document_path text,
  verification_status     verification_status not null default 'pending',
  rating_avg              numeric(3,2),
  jobs_completed          integer not null default 0,
  approved_at             timestamptz
);

create table addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references profiles (id) on delete cascade,
  postal_code  text not null,
  city         text not null,
  district     text,
  street       text not null,
  house_number text not null,
  apartment    text,
  floor        text,
  lat          double precision,
  lng          double precision,
  created_at   timestamptz not null default now()
);

create table bookings (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references profiles (id),
  address_id              uuid not null references addresses (id),
  cleaner_id              uuid references profiles (id),
  cleaning_type           cleaning_type not null default 'normal',
  size_m2                 integer,
  rooms                   integer,
  bathrooms               integer,
  duration_hours          integer not null check (duration_hours between 3 and 8),
  priorities              jsonb not null default '[]',
  has_pets                boolean not null default false,
  smoking                 boolean not null default false,
  has_elevator            boolean not null default false,
  someone_home            boolean not null default false,
  photo_urls              text[] not null default '{}',
  scheduled_date          date not null,
  start_time              time not null,
  base_price              numeric(10,2) not null,
  surcharge_pct           numeric(5,2) not null default 0,
  total_price             numeric(10,2) not null,
  prepayment_amount       numeric(10,2) not null,
  reservation_fee_amount  numeric(10,2) not null,
  status                  booking_status not null default 'draft',
  -- 'İşi Al' kilidi: rezervasyon ücreti ödemesi sırasında 10 dk'lık kilit
  claim_locked_by         uuid references profiles (id),
  claim_locked_at         timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index bookings_status_idx on bookings (status);
create index bookings_customer_idx on bookings (customer_id);
create index bookings_cleaner_idx on bookings (cleaner_id);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings (id),
  payer           payer_role not null,
  type            payment_type not null,
  provider        text not null default 'paypal',
  paypal_order_id text unique,
  capture_id      text,
  amount          numeric(10,2) not null,
  currency        text not null default 'EUR',
  status          payment_status not null default 'created',
  webhook_payload jsonb,
  created_at      timestamptz not null default now()
);

create index payments_booking_idx on payments (booking_id);

create table job_events (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings (id),
  type        job_event_type not null,
  lat         double precision,
  lng         double precision,
  distance_m  numeric(10,1),
  created_at  timestamptz not null default now()
);

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings (id),
  reviewer    payer_role not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (booking_id, reviewer)
);

create table cancellations (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid not null references bookings (id),
  cancelled_by           text not null check (cancelled_by in ('customer', 'cleaner', 'platform')),
  reason                 text,
  applied_rule           text not null,
  customer_refund_amount numeric(10,2) not null default 0,
  cleaner_refund_amount  numeric(10,2) not null default 0,
  created_at             timestamptz not null default now()
);

create table penalties (
  id          uuid primary key default gen_random_uuid(),
  cleaner_id  uuid not null references profiles (id),
  booking_id  uuid references bookings (id),
  points      integer not null default 1,
  reason      text not null,
  created_at  timestamptz not null default now()
);

create table support_threads (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles (id),
  wa_phone    text not null,
  created_at  timestamptz not null default now()
);

create table support_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references support_threads (id) on delete cascade,
  direction       message_direction not null,
  original_text   text not null,
  translated_text text,
  language        text,
  admin_approved  boolean not null default false,
  wa_message_id   text,
  created_at      timestamptz not null default now()
);

-- Admin panelinden yönetilebilir fiyat kuralları (PRD Bölüm 5 / 12)
create table price_rules (
  key        text primary key,
  value      numeric(10,2) not null,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

insert into price_rules (key, value) values
  ('prepayment_pct',   20),   -- müşteri ön ödemesi %
  ('fee_pct',          10),   -- temizlikçi rezervasyon ücreti %
  ('moving_pct',       20),   -- taşınma temizliği ek %
  ('construction_pct', 35),   -- inşaat/tadilat sonrası ek %
  ('base_hour_price',  25);   -- saatlik baz fiyat (EUR)

-- ============================================================
-- TRIGGERS
-- ============================================================

-- auth.users -> profiles otomatik kayıt
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function public.set_updated_at();

-- ============================================================
-- HELPERS (RLS içinde kullanılır)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- OPEN JOBS VIEW — maskelenmiş adres (PRD Bölüm 10)
-- Ödeme öncesi SADECE: şehir, ilçe, posta kodu ilk 3 hane,
-- ~1 km hassasiyetli koordinat (mesafe hesabı için), tutar, tarih, süre.
-- ============================================================

create view open_jobs as
select
  b.id,
  a.city,
  a.district,
  left(a.postal_code, 3) || 'xx'      as postal_prefix,
  round(a.lat::numeric, 2)::float8    as approx_lat,
  round(a.lng::numeric, 2)::float8    as approx_lng,
  b.cleaning_type,
  b.size_m2,
  b.rooms,
  b.bathrooms,
  b.duration_hours,
  b.scheduled_date,
  b.start_time,
  b.total_price,
  b.reservation_fee_amount,
  b.created_at
from bookings b
join addresses a on a.id = b.address_id
where b.status = 'open'
  and (b.claim_locked_at is null or b.claim_locked_at < now() - interval '10 minutes');

-- View, tablo RLS'ini owner yetkisiyle bypass eder (maskelenmiş alanları
-- herkese açmak için bilinçli tercih). Tam adres alanları view'da YOK.
grant select on open_jobs to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles         enable row level security;
alter table cleaner_profiles enable row level security;
alter table addresses        enable row level security;
alter table bookings         enable row level security;
alter table payments         enable row level security;
alter table job_events       enable row level security;
alter table reviews          enable row level security;
alter table cancellations    enable row level security;
alter table penalties        enable row level security;
alter table support_threads  enable row level security;
alter table support_messages enable row level security;
alter table price_rules      enable row level security;

-- profiles
create policy "own profile read"   on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from profiles p where p.id = auth.uid()));
create policy "admin profile update" on profiles for update using (is_admin());

-- cleaner_profiles
create policy "own cleaner profile" on cleaner_profiles for select
  using (user_id = auth.uid() or is_admin());
create policy "own cleaner insert" on cleaner_profiles for insert
  with check (user_id = auth.uid());
create policy "own cleaner update" on cleaner_profiles for update
  using (user_id = auth.uid() and verification_status <> 'approved');
create policy "admin cleaner update" on cleaner_profiles for update using (is_admin());

-- addresses — KRİTİK KURAL (PRD Bölüm 10):
-- Temizlikçi tam adresi YALNIZCA kendisine atanmış (ücreti ödenmiş) işte görür.
create policy "customer own addresses" on addresses for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "admin addresses" on addresses for select using (is_admin());
create policy "assigned cleaner reads address" on addresses for select
  using (
    exists (
      select 1 from bookings b
      where b.address_id = addresses.id
        and b.cleaner_id = auth.uid()
        and b.status in ('assigned', 'in_progress', 'completed')
    )
  );

-- bookings
create policy "customer own bookings" on bookings for select
  using (customer_id = auth.uid() or is_admin());
create policy "customer creates booking" on bookings for insert
  with check (customer_id = auth.uid());
create policy "customer updates draft" on bookings for update
  using (customer_id = auth.uid() and status in ('draft', 'pending_payment'));
create policy "assigned cleaner reads booking" on bookings for select
  using (cleaner_id = auth.uid());
-- Durum geçişleri (open->assigned, start, complete, cancel) yalnızca
-- service role üzerinden API'de yapılır; authenticated'a update verilmez.

-- payments — yazma yalnızca service role (webhook); okuma: ödeyen + admin
create policy "payer reads payment" on payments for select
  using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.id = payments.booking_id
        and (
          (payments.payer = 'customer' and b.customer_id = auth.uid()) or
          (payments.payer = 'cleaner'  and b.cleaner_id  = auth.uid())
        )
    )
  );

-- job_events — taraflar okur; yazma service role (GPS doğrulaması API'de)
create policy "participants read job events" on job_events for select
  using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.id = job_events.booking_id
        and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
    )
  );

-- reviews — taraflar kendi değerlendirmesini yazar, ilgili herkes okur
create policy "participants read reviews" on reviews for select
  using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.id = reviews.booking_id
        and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
    )
  );
create policy "participant writes own review" on reviews for insert
  with check (
    exists (
      select 1 from bookings b
      where b.id = reviews.booking_id
        and b.status = 'completed'
        and (
          (reviews.reviewer = 'customer' and b.customer_id = auth.uid()) or
          (reviews.reviewer = 'cleaner'  and b.cleaner_id  = auth.uid())
        )
    )
  );

-- cancellations / penalties — okuma: ilgili taraf + admin; yazma: service role
create policy "participants read cancellations" on cancellations for select
  using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.id = cancellations.booking_id
        and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
    )
  );
create policy "cleaner reads own penalties" on penalties for select
  using (cleaner_id = auth.uid() or is_admin());

-- support — kendi thread'i + admin
create policy "own support threads" on support_threads for select
  using (customer_id = auth.uid() or is_admin());
create policy "own support messages" on support_messages for select
  using (
    is_admin()
    or exists (
      select 1 from support_threads t
      where t.id = support_messages.thread_id and t.customer_id = auth.uid()
    )
  );

-- price_rules — herkes okur, admin yazar (service role da yazabilir)
create policy "read price rules" on price_rules for select using (true);
create policy "admin writes price rules" on price_rules for update using (is_admin());

-- ============================================================
-- STORAGE — kimlik belgeleri için private bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Belgeler: documents/{user_id}/... yolunda; sahibi yazar/okur, admin okur
create policy "own documents rw" on storage.objects
  for all
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "admin reads documents" on storage.objects
  for select using (bucket_id = 'documents' and is_admin());
