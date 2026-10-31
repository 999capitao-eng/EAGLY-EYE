'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { norm } from '@/lib/util';
import Logo from '@/components/Logo';
import LeadCard, { WhatsAppButton } from '@/components/LeadCard';

const DEFAULT_MSG = 'Olá! Vi o {nome} e queria te mostrar como um site ou landing page pode trazer mais clientes pra você. Posso te explicar rapidinho?';
const COLUMNS = [
  { id: 'a_abordar', title: 'A abordar' },
  { id: 'abordado', title: 'Abordados' },
];

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [view, setView] = useState('search');
  const [lists, setLists] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeList, setActiveList] = useState(null);

  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [report, setReport] = useState(null);
  const [searching, setSearching] = useState(false);
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);

  const [msgTpl, setMsgTpl] = useState(DEFAULT_MSG);
  const [toast, setToast] = useState('');
  const [overList, setOverList] = useState(null);
  const [overCol, setOverCol] = useState(null);

  // ---- sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setSession(data.session);
    });
    const saved = localStorage.getItem('ee_msg');
    if (saved) setMsgTpl(saved);
  }, [router]);

  useEffect(() => {
    if (session) loadAll();
  }, [session]);

  async function loadAll() {
    const [l, ld] = await Promise.all([
      supabase.from('lists').select('*').order('created_at'),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ]);
    setLists(l.data || []);
    setLeads(ld.data || []);
  }

  function say(t) {
    setToast(t);
    setTimeout(() => setToast(''), 2200);
  }

  // ---- busca
  async function search(e) {
    e.preventDefault();
    setSearching(true);
    setReport(null);
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session.access_token}` },
      body: JSON.stringify({ niche, city }),
    });
    const json = await res.json();
    setSearching(false);
    if (!res.ok) return say(json.error || 'Erro na busca');
    setResults(json.results);
    setReport(json.report);
  }

  const filtered = useMemo(
    () => results.filter((r) => (!onlyNoSite || !r.website) && (!onlyPhone || r.phone)),
    [results, onlyNoSite, onlyPhone]
  );

  // ---- listas
  async function createList() {
    const name = prompt('Nome da lista (ex: Academias Teresina)', niche && city ? `${niche} ${city}` : '');
    if (!name?.trim()) return;
    const { data, error } = await supabase.from('lists').insert({ name: name.trim(), niche }).select().single();
    if (error) return say(error.message);
    setLists([...lists, data]);
    return data;
  }

  async function deleteList(id) {
    if (!confirm('Apagar esta lista e todos os clientes dentro dela?')) return;
    await supabase.from('lists').delete().eq('id', id);
    setLists(lists.filter((l) => l.id !== id));
    setLeads(leads.filter((l) => l.list_id !== id));
    if (activeList === id) { setActiveList(null); setView('search'); }
  }

  function openList(id) {
    setActiveList(id);
    setView('list');
  }

  // ---- leads
  async function saveResult(r, listId, status = 'a_abordar') {
    if (!listId) return say('Escolha uma lista');
    if (leads.some((l) => l.list_id === listId && norm(l.name) === norm(r.name))) return say('Já está nessa lista');
    const row = {
      list_id: listId, niche: r.niche, name: r.name, phone: r.phone, city: r.city, address: r.address,
      website: r.website, instagram: r.instagram, sources: r.sources, status,
      contacted_at: status === 'abordado' ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from('leads').insert(row).select().single();
    if (error) return say(error.message);
    setLeads([data, ...leads]);
    say('Salvo na lista');
  }

  async function setStatus(id, status) {
    const patch = { status, contacted_at: status === 'abordado' ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
    setLeads(leads.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await supabase.from('leads').update(patch).eq('id', id);
  }

  async function removeLead(id) {
    setLeads(leads.filter((l) => l.id !== id));
    await supabase.from('leads').delete().eq('id', id);
  }

  function message(lead) {
    return msgTpl.replaceAll('{nome}', lead.name);
  }

  // ---- drag and drop
  const drag = (payload) => (e) => e.dataTransfer.setData('text/plain', JSON.stringify(payload));
  const readDrop = (e) => {
    try { return JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return null; }
  };

  function dropOnList(e, listId) {
    e.preventDefault();
    setOverList(null);
    const p = readDrop(e);
    if (p?.type === 'result') saveResult(p.lead, listId);
    if (p?.type === 'lead') {
      const lead = leads.find((l) => l.id === p.id);
      if (lead && lead.list_id !== listId) {
        setLeads(leads.map((l) => (l.id === p.id ? { ...l, list_id: listId } : l)));
        supabase.from('leads').update({ list_id: listId }).eq('id', p.id);
        say('Movido para a lista');
      }
    }
  }

  function dropOnColumn(e, status) {
    e.preventDefault();
    setOverCol(null);
    const p = readDrop(e);
    if (p?.type === 'lead') setStatus(p.id, status);
    if (p?.type === 'result') saveResult(p.lead, activeList, status);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!session) return null;
  const current = lists.find((l) => l.id === activeList);
  const listLeads = leads.filter((l) => l.list_id === activeList);

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Logo size={36} /> Eagle Eye</div>
        <button className={`nav ${view === 'search' ? 'on' : ''}`} onClick={() => setView('search')}>Pesquisar</button>

        <h3>
          Minhas listas
          <button className="btn small" onClick={createList}>+ Nova</button>
        </h3>
        {lists.length === 0 && <p className="row" style={{ padding: '0 12px' }}>Crie uma lista para guardar clientes.</p>}
        {lists.map((l) => (
          <button
            key={l.id}
            className={`list-item ${view === 'list' && activeList === l.id ? 'on' : ''} ${overList === l.id ? 'over' : ''}`}
            onClick={() => openList(l.id)}
            onDragOver={(e) => { e.preventDefault(); setOverList(l.id); }}
            onDragLeave={() => setOverList(null)}
            onDrop={(e) => dropOnList(e, l.id)}
          >
            <span>{l.name}</span>
            <span className="count">{leads.filter((x) => x.list_id === l.id).length}</span>
          </button>
        ))}
        <div className="spacer" />
        <button className="nav" onClick={logout}>Sair</button>
      </aside>

      <main className="main">
        {view === 'search' && (
          <>
            <h2>Pesquisar clientes</h2>
            <form className="search" onSubmit={search}>
              <input placeholder="Nicho (ex: academia, barbearia)" value={niche} onChange={(e) => setNiche(e.target.value)} required />
              <input placeholder="Cidade (ex: Teresina PI)" value={city} onChange={(e) => setCity(e.target.value)} required />
              <button className="btn primary" disabled={searching}>{searching ? 'Buscando...' : 'Buscar'}</button>
            </form>

            {results.length > 0 && (
              <div className="filters">
                <span>{filtered.length} de {results.length}</span>
                <button className={`chip ${onlyNoSite ? 'on' : ''}`} onClick={() => setOnlyNoSite(!onlyNoSite)}>Só sem site</button>
                <button className={`chip ${onlyPhone ? 'on' : ''}`} onClick={() => setOnlyPhone(!onlyPhone)}>Só com telefone</button>
                <span>Arraste um card para uma lista à esquerda.</span>
              </div>
            )}
            {report && (
              <p className="report">{Object.entries(report).map(([k, v]) => `${k}: ${v}`).join('  |  ')}</p>
            )}

            {searching && <div className="empty">Consultando Google, Foursquare, Geoapify e OpenStreetMap...</div>}
            {!searching && results.length === 0 && <div className="empty">Digite um nicho e uma cidade para começar.</div>}

            <div className="grid">
              {filtered.map((r, i) => (
                <LeadCard key={r.name + i} lead={r} onDragStart={drag({ type: 'result', lead: r })}>
                  <select value="" onChange={(e) => saveResult(r, e.target.value)}>
                    <option value="">Salvar em...</option>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </LeadCard>
              ))}
            </div>
          </>
        )}

        {view === 'list' && current && (
          <>
            <h2>{current.name}</h2>
            <div className="msgbox">
              <label>Mensagem do WhatsApp (use {'{nome}'} para o nome da empresa)</label>
              <textarea value={msgTpl} onChange={(e) => { setMsgTpl(e.target.value); localStorage.setItem('ee_msg', e.target.value); }} />
            </div>
            <div className="board">
              {COLUMNS.map((c) => {
                const items = listLeads.filter((l) => l.status === c.id);
                return (
                  <section
                    key={c.id}
                    className={`col ${overCol === c.id ? 'over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setOverCol(c.id); }}
                    onDragLeave={() => setOverCol(null)}
                    onDrop={(e) => dropOnColumn(e, c.id)}
                  >
                    <div className="col-head"><span>{c.title}</span><span className="count">{items.length}</span></div>
                    {items.length === 0 && <p className="row">Arraste clientes para cá.</p>}
                    {items.map((l) => (
                      <LeadCard key={l.id} lead={l} onDragStart={drag({ type: 'lead', id: l.id })}>
                        <WhatsAppButton
                          phone={l.phone}
                          text={message(l)}
                          onClick={() => l.status === 'a_abordar' && setStatus(l.id, 'abordado')}
                        />
                        <button className="btn small" onClick={() => setStatus(l.id, l.status === 'abordado' ? 'a_abordar' : 'abordado')}>
                          {l.status === 'abordado' ? 'Voltar p/ A abordar' : 'Marcar abordado'}
                        </button>
                        <button className="btn small" onClick={() => removeLead(l.id)}>Remover</button>
                      </LeadCard>
                    ))}
                  </section>
                );
              })}
            </div>
            <p style={{ marginTop: 20 }}>
              <button className="btn small" onClick={() => deleteList(current.id)}>Apagar lista</button>
            </p>
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
