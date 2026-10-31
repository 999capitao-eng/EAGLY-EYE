export async function searchFoursquare({ niche, city }) {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) return { skipped: 'sem chave' };

  const params = new URLSearchParams({
    query: niche,
    near: `${city}, Brasil`,
    limit: '50',
    fields: 'fsq_place_id,name,location,tel,website,social_media',
  });
  const res = await fetch(`https://places-api.foursquare.com/places/search?${params}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'X-Places-Api-Version': '2025-06-17',
    },
  });
  if (!res.ok) throw new Error(`Foursquare ${res.status}`);
  const json = await res.json();

  return {
    items: (json.results || []).map((p) => ({
      name: p.name || '',
      phone: p.tel || '',
      address: p.location?.formatted_address || '',
      website: p.website || '',
      instagram: p.social_media?.instagram || '',
      source: 'foursquare',
    })),
  };
}
