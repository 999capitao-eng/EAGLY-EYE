// Mapa simples nicho -> categoria Geoapify. Adicione mais quando quiser.
const CATEGORIES = {
  academia: 'sport.fitness',
  restaurante: 'catering.restaurant',
  lanchonete: 'catering.fast_food',
  cafe: 'catering.cafe',
  padaria: 'commercial.food_and_drink.bakery',
  barbearia: 'service.beauty.hairdresser',
  salao: 'service.beauty.hairdresser',
  cabeleireiro: 'service.beauty.hairdresser',
  dentista: 'healthcare.dentist',
  clinica: 'healthcare.clinic_or_praxis',
  farmacia: 'healthcare.pharmacy',
  hotel: 'accommodation.hotel',
  pousada: 'accommodation.guest_house',
  oficina: 'service.vehicle.repair',
  petshop: 'pet.shop',
  veterinario: 'pet.veterinary',
  escola: 'education.school',
  supermercado: 'commercial.supermarket',
  roupa: 'commercial.clothing',
  advogado: 'office.lawyer',
  contador: 'office.accountant',
  imobiliaria: 'office.estate_agent',
};

function findCategory(niche) {
  const n = niche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const key = Object.keys(CATEGORIES).find((k) => n.includes(k));
  return key ? CATEGORIES[key] : null;
}

export async function searchGeoapify({ niche, city }) {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return { skipped: 'sem chave' };

  const category = findCategory(niche);
  if (!category) return { skipped: 'nicho sem categoria mapeada' };

  const g = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city + ', Brasil')}&limit=1&apiKey=${key}`);
  if (!g.ok) throw new Error(`Geoapify geocode ${g.status}`);
  const gj = await g.json();
  const coords = gj.features?.[0]?.geometry?.coordinates;
  if (!coords) return { items: [] };

  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${coords[0]},${coords[1]},8000&limit=50&apiKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geoapify ${res.status}`);
  const json = await res.json();

  return {
    items: (json.features || [])
      .filter((f) => f.properties?.name)
      .map((f) => {
        const p = f.properties;
        return {
          name: p.name,
          phone: p.contact?.phone || p.datasource?.raw?.phone || '',
          address: p.formatted || '',
          website: p.website || p.contact?.website || '',
          instagram: p.datasource?.raw?.['contact:instagram'] || '',
          source: 'geoapify',
        };
      }),
  };
}
