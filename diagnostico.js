const fs = require('fs');
const path = require('path');

console.log('Node:', process.version);
console.log('Pasta atual:', process.cwd());
console.log('\nArquivos na pasta:');
console.log(fs.readdirSync('.').filter(f => f.startsWith('.') || f === 'package.json').join('\n'));

const file = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(file)) {
  console.log('\n❌ .env.local NÃO existe nesta pasta. Veja se o nome está certo acima.');
  process.exit();
}

const raw = fs.readFileSync(file, 'utf8');
console.log('\nBOM no início:', raw.charCodeAt(0) === 0xfeff);
const env = {};
raw.split(/\r?\n/).forEach((line, i) => {
  if (!line.trim() || line.trim().startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx < 0) return console.log(`Linha ${i + 1} sem "=":`, line.slice(0, 20));
  const key = line.slice(0, idx);
  const val = line.slice(idx + 1);
  env[key.trim()] = val;
  const problemas = [];
  if (key !== key.trim()) problemas.push('espaço no nome');
  if (val !== val.trim()) problemas.push('espaço no valor');
  if (/^["']|["']$/.test(val.trim())) problemas.push('aspas');
  console.log(`${key.trim()} => "${val.trim().slice(0, 14)}..." (${val.trim().length} caracteres)`, problemas.length ? '⚠️ ' + problemas.join(', ') : '');
});

const url = (env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
console.log('\nURL começa com https://?', url.startsWith('https://'));
console.log('URL termina com .supabase.co?', url.endsWith('.supabase.co'));

if (url.startsWith('http')) {
  fetch(url + '/auth/v1/health', { headers: { apikey: anon } })
    .then(async r => console.log('\nConexão com Supabase:', r.status, (await r.text()).slice(0, 120)))
    .catch(e => console.log('\n❌ Não conectou ao Supabase:', e.cause?.code || e.message));
} else {
  console.log('\n❌ A URL não é um endereço válido.');
}