import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabaseServer';
import { searchGoogle } from '@/lib/providers/google';
import { searchOSM } from '@/lib/providers/osm';
import { searchFoursquare } from '@/lib/providers/foursquare';
import { searchGeoapify } from '@/lib/providers/geoapify';
import { mergeResults } from '@/lib/merge';
import { enrichInstagram } from '@/lib/instagram';

export const maxDuration = 60;

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { niche, city } = await req.json();
  if (!niche?.trim() || !city?.trim()) {
    return NextResponse.json({ error: 'Informe nicho e cidade' }, { status: 400 });
  }
  const q = { niche: niche.trim(), city: city.trim() };

  const providers = { google: searchGoogle, foursquare: searchFoursquare, geoapify: searchGeoapify, osm: searchOSM };
  const names = Object.keys(providers);
  const settled = await Promise.allSettled(names.map((n) => providers[n](q)));

  const all = [];
  const report = {};
  settled.forEach((r, i) => {
    const name = names[i];
    if (r.status === 'rejected') report[name] = `erro: ${r.reason?.message || 'falhou'}`;
    else if (r.value.skipped) report[name] = `pulado (${r.value.skipped})`;
    else {
      report[name] = `${r.value.items.length} resultados`;
      all.push(...r.value.items);
    }
  });

  const merged = mergeResults(all);
  await enrichInstagram(merged);

  return NextResponse.json({ results: merged.map((m) => ({ ...m, niche: q.niche, city: q.city })), report });
}
