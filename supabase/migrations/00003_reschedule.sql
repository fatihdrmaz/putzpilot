-- Erteleme (Termin verschieben) — PRD 11.3: 24 saatten fazla varken 1 kez ücretsiz.
alter table bookings add column if not exists reschedule_count integer not null default 0;
