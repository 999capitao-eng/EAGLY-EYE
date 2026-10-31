// OpenStreetMap via Nominatim (grátis, sem chave). Respeite 1 req/seg.
export async function searchOSM({ niche, city }) {
  const params = new URLSearchParams({
    q: `${niche} ${city}`,
    format: 'jsonv2',
    extratags: '1',
    addressdetails: '1',
    limit: '40',
    countrycodes: 'br',
    email: process.env.OSM_CONTACT_EMAIL || '',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'EagleEye/1.0', 'Accept-Language': 'pt-BR' },
  });
  if (!res.ok) throw new Error(`OSM ${res.status}`);
  const json = await res.json();

  return {
    items: json
      .filter((p) => p.name)
      .map((p) => {
        const t = p.extratags || {};
        const insta = t['contact:instagram'] || t.instagram || '';
        return {
          name: p.name,
          phone: t.phone || t['contact:phone'] || t['contact:mobile'] || '',
          address: p.display_name || '',
          website: t.website || t['contact:website'] || '',
          instagram: insta,
          source: 'osm',
        };
      }),
  };
}
