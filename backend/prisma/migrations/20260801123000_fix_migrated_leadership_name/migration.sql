-- The singleton stored a full display name; split it after the source table is retired.
UPDATE "LeadershipMember"
SET
  "firstName" = regexp_replace("lastName", E'\\s+\\S+$', ''),
  "lastName" = regexp_replace("lastName", E'^.*\\s+', ''),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'dr-kamran-rzayev'
  AND "lastName" LIKE '% %';
