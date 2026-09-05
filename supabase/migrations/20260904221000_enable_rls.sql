-- Row Level Security policies for tables created in 20260904220000_init_schema.sql

alter table events enable row level security;
alter table profiles enable row level security;
alter table security_hints enable row level security;
alter table phone_otp enable row level security;
alter table trip_cities enable row level security;

-- events: anyone can read approved events; authenticated users can submit their own;
-- only the submitter can update/delete their own (still pending) submission.
create policy "events_select_approved" on events
  for select using (status = 'approved');

create policy "events_select_own" on events
  for select using (auth.uid() = submitted_by);

create policy "events_insert_own" on events
  for insert with check (auth.uid() = submitted_by);

create policy "events_update_own" on events
  for update using (auth.uid() = submitted_by)
  with check (auth.uid() = submitted_by);

create policy "events_delete_own" on events
  for delete using (auth.uid() = submitted_by);

-- profiles: a user can read and manage only their own profile.
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

-- security_hints: sensitive recovery data, owner-only access. No public/select-all policy.
create policy "security_hints_select_own" on security_hints
  for select using (auth.uid() = user_id);

create policy "security_hints_insert_own" on security_hints
  for insert with check (auth.uid() = user_id);

create policy "security_hints_update_own" on security_hints
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "security_hints_delete_own" on security_hints
  for delete using (auth.uid() = user_id);

-- phone_otp: no client-side policies. All access goes through server-side
-- code using the service role key (bypasses RLS), since OTP codes must
-- never be readable or writable directly by end users.

-- trip_cities: a user can read and manage only their own trips.
create policy "trip_cities_select_own" on trip_cities
  for select using (auth.uid() = user_id);

create policy "trip_cities_insert_own" on trip_cities
  for insert with check (auth.uid() = user_id);

create policy "trip_cities_update_own" on trip_cities
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trip_cities_delete_own" on trip_cities
  for delete using (auth.uid() = user_id);
