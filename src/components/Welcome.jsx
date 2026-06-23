import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the session is captured if there's a token in the URL
    supabase.auth.getSession().then(() => {
      const timer = setTimeout(() => {
        navigate('/');
      }, 4000);
      return () => clearTimeout(timer);
    });
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: '20px'
    }}>
      <CheckCircle size={80} color="#00C49F" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Email Confirmado com Sucesso!</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', lineHeight: '1.5' }}>
        Bem-vindo ao TaskForge! Sua conta foi verificada e você já está autenticado no sistema.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '24px' }}>
        Redirecionando para o seu painel em instantes...
      </p>
    </div>
  );
}
