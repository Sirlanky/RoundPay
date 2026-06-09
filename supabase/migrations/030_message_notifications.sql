-- Notify recipients of new direct messages (drives in-app notifications + push).
-- Mirrors the create_notification trigger pattern from 014_notifications.sql so
-- the existing notifications -> dispatch-push webhook delivers a push as well.

create or replace function public.notify_on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  preview text;
begin
  select coalesce(nullif(btrim(full_name), ''), 'New message')
    into sender_name
  from public.profiles
  where id = new.sender_id;

  preview := new.body;
  if length(preview) > 140 then
    preview := left(preview, 137) || '...';
  end if;

  perform public.create_notification(
    new.recipient_id,
    null,
    'direct_message',
    sender_name,
    preview,
    new.sender_id
  );

  return new;
end;
$$;

drop trigger if exists direct_messages_notify on public.direct_messages;
create trigger direct_messages_notify
  after insert on public.direct_messages
  for each row execute function public.notify_on_direct_message();

notify pgrst, 'reload schema';
