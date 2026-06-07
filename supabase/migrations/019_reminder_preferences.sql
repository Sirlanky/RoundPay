-- Reminder notification preferences (contribution / overdue / payout + daily time)

alter table public.profiles
  add column if not exists reminders_enabled boolean not null default true,
  add column if not exists reminder_contributions boolean not null default true,
  add column if not exists reminder_overdue boolean not null default true,
  add column if not exists reminder_payouts boolean not null default true,
  add column if not exists reminder_hour smallint not null default 9;

alter table public.profiles drop constraint if exists profiles_reminder_hour_check;
alter table public.profiles
  add constraint profiles_reminder_hour_check
  check (reminder_hour >= 6 and reminder_hour <= 21);

comment on column public.profiles.reminders_enabled is 'Master switch for scheduled payment reminders.';
comment on column public.profiles.reminder_hour is 'Preferred hour (6–21) in Africa/Lagos time for daily reminders.';

notify pgrst, 'reload schema';
