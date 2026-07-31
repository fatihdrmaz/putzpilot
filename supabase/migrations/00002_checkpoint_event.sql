-- %75 süre kontrol mesajı için event tipi (cron idempotency işareti)
alter type job_event_type add value if not exists 'checkpoint_75';
