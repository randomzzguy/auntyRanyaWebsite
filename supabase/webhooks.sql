-- Email notification webhooks setup
-- Run this in your Supabase SQL Editor after deploying Edge Functions

-- ============================================
-- IMPORTANT: Replace the URLs below with your actual deployed Edge Function URLs.
-- They look like: https://<project-ref>.functions.supabase.co/send-order-notification
-- Find your project ref in Supabase Dashboard → Project Settings → General
-- ============================================

-- 1. Enable pg_net extension (needed for HTTP calls from Postgres triggers)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Function to notify on NEW ORDER (admin email)
CREATE OR REPLACE FUNCTION notify_order_placed()
RETURNS TRIGGER AS $$
DECLARE
  project_ref TEXT := 'ronwzzswdcmvnhkuwxru';  -- REPLACE with your actual project ref if different
BEGIN
  PERFORM net.http_post(
    url := 'https://' || project_ref || '.supabase.co/functions/v1/send-order-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbnd6enN3ZGNtdm5oa3V3eHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MjAxOTY0MDAwMH0'  -- REPLACE with your actual anon key if different
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail silently so the order insert is never blocked by email failure
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for new orders
DROP TRIGGER IF EXISTS order_placed_trigger ON orders;
CREATE TRIGGER order_placed_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_placed();

-- 4. Function to notify on ORDER STATUS UPDATE (customer email)
CREATE OR REPLACE FUNCTION notify_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  project_ref TEXT := 'ronwzzswdcmvnhkuwxru';  -- REPLACE with your actual project ref if different
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM net.http_post(
      url := 'https://' || project_ref || '.supabase.co/functions/v1/send-status-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbnd6enN3ZGNtdm5oa3V3eHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MjAxOTY0MDAwMH0'  -- REPLACE with your actual anon key if different
      ),
      body := jsonb_build_object('record', row_to_json(NEW), 'old_record', row_to_json(OLD))
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail silently so the order update is never blocked by email failure
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for status changes
DROP TRIGGER IF EXISTS order_status_changed_trigger ON orders;
CREATE TRIGGER order_status_changed_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_changed();
