import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Board from './components/Board';
import Login from './components/Login';
import Welcome from './components/Welcome';
import CalendarView from './components/CalendarView';
import TodoList from './components/TodoList';
import SettingsModal from './components/SettingsModal';
import MeetingAlert from './components/MeetingAlert';
import Analytics from './components/Analytics';
import { Search, Plus, LogOut, Share2, Menu, Edit2, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

import Overview from './components/Overview';

// Componente principal quando logado
function MainApp({ session }) {
  const [searchParams] = useSearchParams();
  const sharedBoardId = searchParams.get('board');
  
  const [activeView, setActiveView] = useState(sharedBoardId ? 'board' : 'overview');
  const [activeBoardId, setActiveBoardId] = useState(sharedBoardId || null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [bgImage, setBgImage] = useState(localStorage.getItem('datewise_bg') || '');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Listen for custom event from settings
    const handleBgChange = (e) => {
      setBgImage(e.detail);
    };
    window.addEventListener('bg-changed', handleBgChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('bg-changed', handleBgChange);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        
        try {
          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: base64String }
          });
          if (error) throw error;
          
          // Force UI refresh
          window.location.reload();
        } catch (error) {
          console.error("Error updating avatar:", error);
          alert("Erro ao atualizar foto de perfil.");
        } finally {
          setIsUploading(false);
          setShowProfileMenu(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isUrl = bgImage && bgImage.startsWith('url');
  const mainStyle = bgImage ? {
    backgroundImage: isUrl ? bgImage : 'none',
    backgroundColor: isUrl ? 'transparent' : bgImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {};

  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        onChangeView={(view) => {
          setActiveView(view);
          setIsMobileMenuOpen(false);
        }} 
        onOpenSettings={() => {
          setShowSettings(true);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        session={session}
        onEditPhoto={() => fileInputRef.current?.click()}
        onLogout={handleLogout}
        isUploading={isUploading}
      />
      
      {/* Overlay para fechar o menu no celular */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className={`main-content ${bgImage ? 'has-bg' : ''}`} style={mainStyle}>
        <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: 'transparent' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button className="icon-btn mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <Search size={18} className="text-secondary" style={{ marginRight: '8px' }} />
              <input type="text" placeholder="Search..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }} />
            </div>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="icon-btn" style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <Bell size={18} color="var(--text-secondary)" />
            </button>
          </div>
        </header>
        
        <MeetingAlert session={session} />
        
        {activeView === 'overview' && (
          <Overview 
            session={session} 
            onSelectBoard={(id) => {
              setActiveBoardId(id);
              setActiveView('board');
            }} 
          />
        )}
        
        {activeView === 'board' && (
          <Board session={session} sharedBoardId={sharedBoardId} activeBoardId={activeBoardId} />
        )}
        
        {activeView === 'calendar' && (
          <CalendarView session={session} />
        )}

        {activeView === 'todo' && (
          <TodoList session={session} />
        )}

        {activeView === 'analytics' && (
          <Analytics session={session} />
        )}
      </main>

      {showSettings && (
        <SettingsModal 
          session={session} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleProfileImageUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={session ? <MainApp session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/welcome" 
          element={<Welcome />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
