-- Mockup uyum paketi:
-- 1) Rezervasyon not alanı (öncelikler adımındaki "Not ekleyebilirsiniz")
-- 2) Müşteri <-> temizlikçi uygulama içi mesajlaşma
-- 3) Platform ayarları (GPS eşiği, kilit süresi) — admin Ayarlar sayfası

alter table bookings add column if not exists notes text;

-- Uygulama içi mesajlaşma (atama sonrası, iş bazlı)
create table booking_messages (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  sender_id  uuid not null references profiles (id),
  text       text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index booking_messages_booking_idx on booking_messages (booking_id, created_at);

alter table booking_messages enable row level security;

-- Taraflar okur (admin dahil)
create policy "participants read messages" on booking_messages for select
  using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.id = booking_messages.booking_id
        and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
    )
  );

-- Taraflar yazar — yalnızca atama sonrası (adres gizliliği ihlal edilmesin diye
-- open aşamasında mesajlaşma YOK)
create policy "participants write messages" on booking_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_messages.booking_id
        and b.status in ('assigned', 'in_progress', 'completed')
        and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
    )
  );

-- Platform ayarları (price_rules sayısal key-value deposunu kullanır)
insert into price_rules (key, value) values
  ('gps_max_distance_m', 250),
  ('claim_lock_minutes', 10)
on conflict (key) do nothing;
