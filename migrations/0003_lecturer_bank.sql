create table if not exists custom_questions (
  id text primary key,
  stage_id text not null,
  section text not null,
  prompt text not null,
  options text not null default '[]',
  answer text not null,
  aliases text not null default '[]',
  reference text not null default '',
  published integer not null default 1,
  created_at text not null,
  updated_at text not null,
  class_id text not null default 'hall'
);

create index if not exists custom_questions_stage_idx
  on custom_questions (class_id, stage_id, section);
create index if not exists custom_questions_pub_idx
  on custom_questions (class_id, published);

alter table hall_settings add column if not exists notice text not null default '';
alter table hall_settings add column if not exists sitting_open integer not null default 1;
alter table hall_settings add column if not exists bank_mode text not null default 'mix';
alter table hall_settings add column if not exists pack_version integer not null default 1;
alter table hall_settings add column if not exists practice_open integer not null default 1;
alter table hall_settings add column if not exists release_marks integer not null default 0;

alter table scripts add column if not exists questions_json text not null default '[]';
