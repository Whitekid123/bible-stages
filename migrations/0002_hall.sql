create table if not exists hall_settings (
  id text primary key,
  class_password_hash text not null,
  teacher_password_hash text not null,
  exam_size text not null default '20'
);

create table if not exists scripts (
  id text primary key,
  seat_label text not null,
  stage_id text not null,
  question_ids text not null,
  answers text not null default '{}',
  tab_leaves integer not null default 0,
  started_at text not null,
  submitted_at text,
  time_up integer not null default 0,
  duration_sec integer not null,
  teacher_notes text not null default '',
  blank_marks text not null default '{}',
  class_id text not null default 'hall'
);

create index if not exists scripts_submitted_idx on scripts (submitted_at);
create index if not exists scripts_class_idx on scripts (class_id);

insert into hall_settings (id, class_password_hash, teacher_password_hash, exam_size)
values (
  'hall',
  '9ad76fba1356d94c36c7e90da7089e42ac4be08abc138c11be0b6b877d3750bd',
  '0103da4241b637e287daee74abf82bd26c9c8e926a00918843dbc152c108bbed',
  '20'
)
on conflict (id) do nothing;
