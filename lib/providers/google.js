import { useQuota } from '../supabaseServer';

export async function searchGoogle({ niche, city }) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { skipped: 'sem chave' };

  const limit = Number(process.env.GOOGLE_MONTHLY_LIMIT || 200);
  if (!(await useQuota('google', limit))) return { skipped: 'limite mensal atingido' };

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri',
    },
    body: JSON.stringify({ textQuery: `${niche} em ${city}`, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20 }),
  });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const json = await res.json();

  return {
    items: (json.places || []).map((p) => ({
      name: p.displayName?.text || '',
      phone: p.nationalPhoneNumber || '',
      address: p.formattedAddress || '',
      website: p.websiteUri || '',
      instagram: '',
      source: 'google',
    })),
  };
}
