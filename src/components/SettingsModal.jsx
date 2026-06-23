import React, { useState, useEffect } from 'react';
import './SettingsModal.css';
import { X, User, Shield, Bell, Palette, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
const THEME_COLORS = [
  { id: 'blue', value: '#3C64F4' },
  { id: 'green', value: '#00C49F' },
  { id: 'yellow', value: '#FFBB28' },
  { id: 'orange', value: '#FF8042' },
  { id: 'red', value: '#EF4444' },
  { id: 'default', value: '' } // Padrão
];

const WALLPAPERS = [
  { id: 'mountains1', name: 'Montanhas Nevadas', value: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000")' },
  { id: 'mountains2', name: 'Montanhas Escuras', value: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2000")' },
  { id: 'abstract', name: 'Abstrato', value: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000")' }
];

export default function SettingsModal({ onClose, session }) {
  const [activeTab, setActiveTab] = useState('account');
  const [bgImage, setBgImage] = useState(localStorage.getItem('datewise_bg') || '');

  const handleSaveBackground = (bgValue) => {
    setBgImage(bgValue);
    localStorage.setItem('datewise_bg', bgValue);
    
    // Notify App.jsx
    window.dispatchEvent(new CustomEvent('bg-changed', { detail: bgValue }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configurações</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="settings-sidebar">
            <button className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
              <User size={18} /> Conta
            </button>
            <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
              <Palette size={18} /> Aparência
            </button>
            <button className="settings-tab" onClick={() => setActiveTab('notifications')}>
              <Bell size={18} /> Notificações
            </button>
            <button className="settings-tab" onClick={() => setActiveTab('security')}>
              <Shield size={18} /> Segurança
            </button>
          </div>
          
          <div className="settings-main">
            {activeTab === 'account' && (
              <>
                <h3>Perfil da Conta</h3>
                <p className="text-secondary">Informações básicas do seu usuário logado.</p>
                
                <div className="settings-form">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="text" disabled value={session?.user?.email || 'Usuário de Teste'} />
                  </div>
                  <div className="form-group">
                    <label>ID do Usuário</label>
                    <input type="text" disabled value={session?.user?.id || 'id-ficticio-12345'} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <h3>Aparência do Sistema</h3>
                <p className="text-secondary">Personalize a cor ou imagem de fundo do sistema.</p>
                
                <div className="settings-form" style={{ marginTop: '24px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {THEME_COLORS.map(color => (
                        <div
                          key={color.id}
                          onClick={() => handleSaveBackground(color.value)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: color.value || 'var(--bg-primary)',
                            border: bgImage === color.value 
                              ? '2px solid var(--text-primary)' 
                              : (color.value ? '2px solid transparent' : '2px solid var(--border-color)'),
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            transform: bgImage === color.value ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="wallpapers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {WALLPAPERS.map(wp => (
                      <div 
                        key={wp.id}
                        onClick={() => handleSaveBackground(wp.value)}
                        style={{
                          border: bgImage === wp.value ? '2px solid var(--text-primary)' : '2px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ 
                          height: '80px', 
                          background: wp.value || 'var(--bg-primary)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {!wp.value && <ImageIcon size={24} color="var(--text-secondary)" />}
                        </div>
                        <div style={{ padding: '8px', fontSize: '13px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                          {wp.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {['notifications', 'security'].includes(activeTab) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Em breve...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
