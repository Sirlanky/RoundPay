import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendPushToUser, type PushData } from '../_shared/push.ts';

type NotificationRecord = {
  id?: string;
  user_id?: string;
  group_id?: string | null;
  type?: string;
  title?: string;
  message?: string;
  related_entity_id?: string | null;
};

function isAuthorized(req: Request, serviceKey: string): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader === `Bearer ${serviceKey}`) return true;

  const secret = Deno.env.get('DISPATCH_PUSH_SECRET');
  const headerSecret = req.headers.get('x-dispatch-push-secret');
  return Boolean(secret && headerSecret && secret === headerSecret);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!isAuthorized(req, serviceKey)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();
    const record = (payload.record ?? payload) as NotificationRecord;

    if (!record.user_id || !record.title || !record.message) {
      return new Response(JSON.stringify({ skipped: true, reason: 'missing_fields' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const data: PushData = {
      type: record.type,
      groupId: record.group_id ?? undefined,
      relatedEntityId: record.related_entity_id ?? undefined,
      notificationId: record.id,
    };

    const sent = await sendPushToUser(
      supabase,
      record.user_id,
      record.title,
      record.message,
      data
    );

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
