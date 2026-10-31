// Abre o site da empresa e procura o link do Instagram no HTML
export async function findInstagramOnSite(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EagleEye/1.0)' },
    });
    clearTimeout(t);
    if (!res.ok) return '';
    const html = (await res.text()).slice(0, 400000);
    const re = /instagram\.com\/([A-Za-z0-9_.]{2,30})/gi;
    let m;
    while ((m = re.exec(html))) {
      const u = m[1].toLowerCase();
      if (!['p', 'reel', 'reels', 'explore', 'share', 'accounts', 'sharer', 'tv'].includes(u)) {
        return `https://instagram.com/${m[1]}`;
      }
    }
  } catch {}
  return '';
}

export async function enrichInstagram(leads, max = 30) {
  const targets = leads.filter((l) => l.website && !l.instagram).slice(0, max);
  const batch = 6;
  for (let i = 0; i < targets.length; i += batch) {
    await Promise.all(
      targets.slice(i, i + batch).map(async (l) => {
        l.instagram = await findInstagramOnSite(l.website);
      })
    );
  }
  return leads;
}
