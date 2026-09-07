select cron.schedule(
  'registration-reminders',
  '0 * * * *',
  $$select net.http_post(
      url := 'https://project--234557c3-f093-4a73-bc4c-8e74146dd951.lovable.app/api/public/registration-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );$$
);