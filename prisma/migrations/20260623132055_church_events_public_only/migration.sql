-- MegVie events are public-only content.
-- Existing member-only events are normalized before adding the guard.
UPDATE "church_events"
SET "visibility" = 'PUBLIC'
WHERE "visibility" <> 'PUBLIC';

ALTER TABLE "church_events"
DROP CONSTRAINT IF EXISTS "church_events_visibility_public_only";

ALTER TABLE "church_events"
ADD CONSTRAINT "church_events_visibility_public_only"
CHECK ("visibility" = 'PUBLIC');
