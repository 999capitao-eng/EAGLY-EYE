import { whatsappLink } from '@/lib/util';

const dash = <span className="empty-val">vazio</span>;

export default function LeadCard({ lead, onDragStart, children }) {
  const hasSite = !!lead.website;
  return (
    <div className="card" draggable onDragStart={onDragStart}>
      <h4>{lead.name}</h4>
      <div className="badges">
        <span className={`badge ${hasSite ? 'hasite' : 'nosite'}`}>{hasSite ? 'Tem site' : 'Sem site'}</span>
        {(lead.sources || []).map((s) => (
          <span key={s} className="badge">{s}</span>
        ))}
      </div>
      <div className="row"><b>Nicho:</b> {lead.niche || dash}</div>
      <div className="row"><b>Telefone:</b> {lead.phone || dash}</div>
      <div className="row"><b>Local:</b> {lead.address || lead.city || dash}</div>
      <div className="row">
        <b>Site:</b>{' '}
        {lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a> : dash}
      </div>
      <div className="row">
        <b>Instagram:</b>{' '}
        {lead.instagram ? <a href={lead.instagram} target="_blank" rel="noreferrer">{lead.instagram.replace('https://instagram.com/', '@')}</a> : dash}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}

export function WhatsAppButton({ phone, text, onClick }) {
  const link = whatsappLink(phone, text);
  if (!link) return <button className="btn small" disabled>Sem telefone</button>;
  return (
    <a className="btn small primary" href={link} target="_blank" rel="noreferrer" onClick={onClick} style={{ textDecoration: 'none' }}>
      Chamar no WhatsApp
    </a>
  );
}
