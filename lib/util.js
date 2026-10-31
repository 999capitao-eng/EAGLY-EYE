export function norm(s = '') {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

export function digits(s = '') {
  return String(s || '').replace(/\D/g, '');
}

export function whatsappLink(phone, text = '') {
  let d = digits(phone);
  if (!d) return null;
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

const SOCIAL = ['instagram.com', 'facebook.com', 'fb.com', 'linktr.ee', 'wa.me', 'whatsapp.com'];
export function isSocialUrl(url = '') {
  return SOCIAL.some((s) => url.toLowerCase().includes(s));
}
