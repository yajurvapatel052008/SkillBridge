create table volunteers (
  id bigserial primary key,
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  title text not null,
  skill text not null,
  proficiency integer not null check (proficiency between 0 and 100),
  address text not null,
  city text not null,
  trust_score integer not null check (trust_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table volunteer_availability (
  id bigserial primary key,
  volunteer_id bigint not null references volunteers(id) on delete cascade,
  urgency_bucket text not null check (urgency_bucket in ('today', 'tomorrow', 'this_week')),
  start_time time not null,
  end_time time not null
);

create table organisers (
  id bigserial primary key,
  organisation_name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table ngo_requests (
  id bigserial primary key,
  organiser_id bigint not null references organisers(id) on delete cascade,
  required_skill text not null,
  urgency_bucket text not null check (urgency_bucket in ('today', 'tomorrow', 'this_week')),
  request_date date not null,
  address text not null,
  city text not null,
  start_time time not null,
  duration_hours integer not null check (duration_hours between 1 and 8),
  created_at timestamptz not null default now()
);

create table matches (
  id bigserial primary key,
  request_id bigint not null references ngo_requests(id) on delete cascade,
  volunteer_id bigint not null references volunteers(id) on delete cascade,
  total_score integer not null,
  skill_score integer not null,
  availability_score integer not null,
  location_score integer not null,
  trust_score integer not null,
  suggested_slot text,
  created_at timestamptz not null default now()
);
