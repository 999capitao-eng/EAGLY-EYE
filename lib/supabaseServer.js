import { createClient } from '@supabase/supabase-js';

export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getUserFromRequest(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await anonClient().auth.getUser(token);
  return error ? null : data.user;
}

// Controle de cota mensal (protege o Google contra cobrança)
export async function useQuota(provider, limit) {
  const db = adminClient();
  const month = new Date().toISOString().slice(0, 7);
  const { data } = await db.from('api_usage').select('count').eq('provider', provider).eq('month', month).maybeSingle();
  const count = data?.count || 0;
  if (count >= limit) return false;
  await db.from('api_usage').upsert({ provider, month, count: count + 1 });
  return true;
}
