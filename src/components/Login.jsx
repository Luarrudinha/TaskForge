import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';
import { LogIn, UserPlus, ClipboardList } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Verificação de credenciais pendentes
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setError('⚠️ Erro de Configuração: O arquivo .env não foi encontrado ou está sem a variável VITE_SUPABASE_URL. Você precisa adicionar as chaves do Supabase para que o login funcione.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/welcome`
          }
        });
        if (error) throw error;
        alert('Registro concluído! Verifique seu email para confirmação ou faça login se o auto-login estiver ativo.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <ClipboardList size={40} color="white" />
          </div>
          <h2>TaskForge</h2>
          <p className="login-subtitle">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre com sua conta'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'Registrar' : 'Entrar')}
            {!loading && (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            <button 
              className="toggle-auth-btn" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
