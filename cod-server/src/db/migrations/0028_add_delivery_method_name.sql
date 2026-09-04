-- Stores the human-readable delivery provider/driver name on the order
-- (e.g. "EcoTrack", "Ahmed K.") so the status badge can display it
-- without joining against delivery_companies / drivers every time.
ALTER TABLE orders ADD COLUMN delivery_method_name TEXT;
