-- AXE Platform — shared Supabase project
-- Layout: one schema per tool (copy_studio, ...), plus core for shared stuff.
-- Tool schemas are NOT exposed to the public API. Web apps write through
-- small public functions (RPC), so the public key can only do exactly that.

create extension if not exists pgcrypto;

-- ============ core: registry of AXE tools ============
create schema if not exists core;

create table if not exists core.tools (
  id          text primary key,          -- e.g. 'copy_studio'
  name        text not null,
  schema_name text not null,
  created_at  timestamptz not null default now()
);
alter table core.tools enable row level security;

insert into core.tools (id, name, schema_name)
values ('copy_studio', 'HSAD Copy Studio', 'copy_studio')
on conflict (id) do nothing;

-- ============ copy_studio ============
create schema if not exists copy_studio;

-- One row per click of "Generate"
create table if not exists copy_studio.generation_events (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),

  session_id         text,                            -- random id kept in the browser
  user_email         text,                            -- only if the app knows who's signed in
  app_version        text,

  copy_types         text[] not null default '{}',
  tones              text[] not null default '{}',
  options_requested  int,
  options_returned   int,

  brief_chars        int,
  brief_words        int,
  has_attachment     boolean not null default false,
  attachment_count   int not null default 0,
  attachment_types   text[] not null default '{}',

  model              text,
  latency_ms         int,
  success            boolean,
  error_message      text,

  extra              jsonb not null default '{}'::jsonb  -- new metrics land here first
);
alter table copy_studio.generation_events enable row level security;

create index if not exists ge_created_at_idx on copy_studio.generation_events (created_at desc);
create index if not exists ge_tones_idx      on copy_studio.generation_events using gin (tones);
create index if not exists ge_types_idx      on copy_studio.generation_events using gin (copy_types);

-- Write-only entry point for the web app
create or replace function public.copy_studio_log_generation(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into copy_studio.generation_events (
    session_id, user_email, app_version,
    copy_types, tones, options_requested, options_returned,
    brief_chars, brief_words, has_attachment, attachment_count, attachment_types,
    model, latency_ms, success, error_message, extra
  ) values (
    left(p->>'session_id', 100),
    left(p->>'user_email', 200),
    left(p->>'app_version', 50),
    coalesce(array(select jsonb_array_elements_text(p->'copy_types')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'tones')), '{}'),
    (p->>'options_requested')::int,
    (p->>'options_returned')::int,
    (p->>'brief_chars')::int,
    (p->>'brief_words')::int,
    coalesce((p->>'has_attachment')::boolean, false),
    coalesce((p->>'attachment_count')::int, 0),
    coalesce(array(select jsonb_array_elements_text(p->'attachment_types')), '{}'),
    left(p->>'model', 100),
    (p->>'latency_ms')::int,
    (p->>'success')::boolean,
    left(p->>'error_message', 1000),
    coalesce(p->'extra', '{}'::jsonb)
  );
end;
$$;

revoke all on function public.copy_studio_log_generation(jsonb) from public;
grant execute on function public.copy_studio_log_generation(jsonb) to anon, authenticated;

-- Insight views (dashboard only — not reachable with the public key)
create or replace view copy_studio.v_daily_usage as
select created_at::date as day,
       count(*)                         as generations,
       count(distinct session_id)       as unique_sessions,
       round(avg(options_returned), 1)  as avg_options,
       round(avg(brief_words))          as avg_brief_words,
       round(100.0 * avg(has_attachment::int), 1) as pct_with_attachment
from copy_studio.generation_events
group by 1 order by 1 desc;

create or replace view copy_studio.v_tone_usage as
select t as tone, count(*) as uses
from copy_studio.generation_events, unnest(tones) t
group by 1 order by 2 desc;

create or replace view copy_studio.v_copy_type_usage as
select c as copy_type, count(*) as uses
from copy_studio.generation_events, unnest(copy_types) c
group by 1 order by 2 desc;

-- =====================================================================
-- v2 (applied 2026-10-01): event_type + production-only reporting views
-- =====================================================================
alter table copy_studio.generation_events add column if not exists event_type text not null default 'generate';
create index if not exists ge_event_type_idx on copy_studio.generation_events (event_type);

create or replace function public.copy_studio_log_generation(p jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into copy_studio.generation_events (
    event_type, session_id, user_email, app_version,
    copy_types, tones, options_requested, options_returned,
    brief_chars, brief_words, has_attachment, attachment_count, attachment_types,
    model, latency_ms, success, error_message, extra
  ) values (
    coalesce(left(p->>'event_type', 30), 'generate'),
    left(p->>'session_id', 100), left(p->>'user_email', 200), left(p->>'app_version', 50),
    coalesce(array(select jsonb_array_elements_text(p->'copy_types')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p->'tones')), '{}'),
    (p->>'options_requested')::int, (p->>'options_returned')::int,
    (p->>'brief_chars')::int, (p->>'brief_words')::int,
    coalesce((p->>'has_attachment')::boolean, false),
    coalesce((p->>'attachment_count')::int, 0),
    coalesce(array(select jsonb_array_elements_text(p->'attachment_types')), '{}'),
    left(p->>'model', 100), (p->>'latency_ms')::int, (p->>'success')::boolean,
    left(p->>'error_message', 1000), coalesce(p->'extra', '{}'::jsonb)
  );
end; $$;
revoke all on function public.copy_studio_log_generation(jsonb) from public;
grant execute on function public.copy_studio_log_generation(jsonb) to anon, authenticated;

drop view if exists copy_studio.v_daily_usage, copy_studio.v_tone_usage, copy_studio.v_copy_type_usage, copy_studio.v_events;

-- Real usage only: production deploys, no test rows
create view copy_studio.v_events as
select * from copy_studio.generation_events
where coalesce((extra->>'test')::boolean, false) = false
  and coalesce(extra->>'env', 'production') = 'production';

create view copy_studio.v_daily_usage as
select created_at::date as day,
       count(*) as generations,
       count(*) filter (where event_type = 'generate') as fresh_generates,
       count(*) filter (where event_type = 'regenerate_all') as regenerate_alls,
       count(*) filter (where event_type = 'new_option') as new_options,
       count(distinct session_id) as unique_browsers,
       round(avg(options_returned), 1) as avg_options,
       round(avg(cardinality(copy_types)), 1) as avg_copy_types,
       round(avg(brief_words)) as avg_brief_words,
       round(100.0 * avg(has_attachment::int), 1) as pct_with_attachment,
       round(100.0 * avg(success::int), 1) as pct_success,
       round(avg(latency_ms) / 1000.0, 1) as avg_seconds
from copy_studio.v_events group by 1 order by 1 desc;

create view copy_studio.v_tone_usage as
select t as tone, count(*) as uses from copy_studio.v_events, unnest(tones) t group by 1 order by 2 desc;

create view copy_studio.v_copy_type_usage as
select c as copy_type, count(*) as uses from copy_studio.v_events, unnest(copy_types) c group by 1 order by 2 desc;
