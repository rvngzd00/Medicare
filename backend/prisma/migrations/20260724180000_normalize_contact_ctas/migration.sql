-- Keep every editable CTA consistent with the phone-first public experience.
UPDATE "PageSection"
SET "content" = jsonb_set(
  jsonb_set(
    COALESCE("content", '{}'::JSONB),
    '{primaryHref}',
    to_jsonb('tel:+994124503291'::TEXT),
    TRUE
  ),
  '{primaryLabel}',
  to_jsonb('Bizimlə əlaqə saxla'::TEXT),
  TRUE
)
WHERE "type" = 'CTA';
