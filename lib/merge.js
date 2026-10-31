import { norm, digits, isSocialUrl } from './util';

// Quanto menor, mais prioridade (Google vence em caso de divergência)
const PRIORITY = { google: 0, foursquare: 1, geoapify: 2, osm: 3 };

function cleanInsta(v = '') {
  const m = String(v).match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  const user = m ? m[1] : String(v).replace('@', '').trim();
  if (!user || ['p', 'reel', 'reels', 'explore', 'share', 'accounts'].includes(user.toLowerCase())) return '';
  return `https://instagram.com/${user}`;
}

function same(a, b) {
  const pa = digits(a.phone).slice(-8);
  const pb = digits(b.phone).slice(-8);
  if (pa && pb && pa === pb) return true;
  const na = norm(a.name);
  const nb = norm(b.name);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.length >= 6 && nb.length >= 6 && (na.includes(nb) || nb.includes(na));
}

export function mergeResults(items) {
  const sorted = [...items].sort((a, b) => PRIORITY[a.source] - PRIORITY[b.source]);
  const groups = [];

  for (const it of sorted) {
    const g = groups.find((x) => same(x.base, it));
    if (g) g.all.push(it);
    else groups.push({ base: it, all: [it] });
  }

  return groups.map(({ all }) => {
    const pick = (field) => all.map((x) => x[field]).find((v) => v && String(v).trim()) || '';
    let website = pick('website');
    let instagram = cleanInsta(pick('instagram'));

    // Link de rede social no campo "site" não conta como site de verdade
    if (website && /instagram\.com/i.test(website) && !instagram) instagram = cleanInsta(website);
    if (website && isSocialUrl(website)) website = '';

    return {
      name: pick('name'),
      phone: pick('phone'),
      address: pick('address'),
      website,
      instagram,
      sources: [...new Set(all.map((x) => x.source))],
    };
  });
}
