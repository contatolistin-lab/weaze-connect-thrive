-- Drop the constraint that references event_cta(id)
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_fkey;

-- Add the new constraint that references post_cta(id)
ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_event_id_fkey
FOREIGN KEY (event_id) REFERENCES post_cta(id) ON DELETE CASCADE;
