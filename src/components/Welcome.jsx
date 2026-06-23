import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Welcome() {
  useEffect(() => {
    // Ensure the session is captured if there's a token in the URL
    supabase.auth.getSession();
  }, []);

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
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>E-mail Confirmado!</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', lineHeight: '1.5' }}>
        Sua conta foi verificada com sucesso. Você já está conectado.
      </p>
      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
          Você pode fechar esta aba e voltar para a tela original onde estava fazendo o login!
        </p>
      </div>
    </div>
  );
}
