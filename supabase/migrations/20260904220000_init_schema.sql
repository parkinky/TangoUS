-- Tango Events USA — initial schema
-- Tables: events, profiles, security_hints, phone_otp, trip_cities

create table events (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('event', 'festival', 'marathon', 'milonga')),
  city text,
  state text,
  venue text,
  address text,
  start_date date,
  end_date date,
  recurring text, -- 밀롱가용: 요일/주기 (예: "매주 금요일")
  price text,
  website_url text,
  title_ko text,
  title_en text,
  title_es text,
  title_ja text,
  title_zh text,
  description_ko text,
  description_en text,
  description_es text,
  description_ja text,
  description_zh text,
  source text check (source in ('auto_scraped', 'user_submitted')),
  submitted_by uuid references auth.users(id),
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id),
  username text unique,           -- 로그인 아이디
  email text,
  address text,
  phone_number text,
  name text,
  gender text check (gender in ('male', 'female', 'other')),
  tango_role text check (tango_role in ('leader', 'follower')),
  home_city text,                 -- 거주 도시 (기본 이벤트 필터 기준)
  home_state text,
  created_at timestamptz default now()
);

create table security_hints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  hint_question_1 text,
  hint_answer_1 text,             -- 해싱해서 저장
  hint_question_2 text,
  hint_answer_2 text,
  hint_question_3 text,
  hint_answer_3 text,
  created_at timestamptz default now()
);

create table phone_otp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  otp_code text,
  purpose text check (purpose in ('id_recovery', 'password_reset')),
  expires_at timestamptz,
  verified boolean default false,
  created_at timestamptz default now()
);

create table trip_cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  city text,
  state text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Useful indexes for the default list/calendar filtering (city + upcoming date)
create index events_city_start_date_idx on events (city, start_date);
create index events_status_idx on events (status);
create index trip_cities_user_id_idx on trip_cities (user_id);
