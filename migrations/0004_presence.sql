alter table scripts add column if not exists app_leaves integer not null default 0;
alter table scripts add column if not exists last_seen text;
alter table scripts add column if not exists hidden integer not null default 0;

create table if not exists hall_presence (
  seat_label text primary key,
  role text not null default 'student',
  paper_id text,
  stage_id text,
  in_exam integer not null default 0,
  hidden integer not null default 0,
  app_leaves integer not null default 0,
  tab_leaves integer not null default 0,
  answers_saved integer not null default 0,
  last_seen text not null
);
