-- Country code for an event's location (2-letter, e.g. "US", "CA"),
-- alongside the existing US-state / Canadian-province `state` column.
alter table events add column nat text default 'US';

-- Backfill: every row collected before this migration is a US event.
update events set nat = 'US' where nat is null;
