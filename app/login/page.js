'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Logo from '@/components/Logo';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) router.replace('/dashboard');
    else setMsg('Conta criada. Confirme o e-mail e entre.');
  }

  return (
    <main className="login">
      <form className="login-box" onSubmit={submit}>
        <div className="login-brand">
          <Logo size={72} />
          <h1>Eagle Eye</h1>
          <p>Encontre quem precisa de um site.</p>
        </div>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button className="btn primary" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        {msg && <p className="msg">{msg}</p>}
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}
        </button>
      </form>
    </main>
  );
}
