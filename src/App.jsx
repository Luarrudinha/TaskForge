import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Board from './components/Board';
import Login from './components/Login';
import CalendarView from './components/CalendarView';
import SettingsModal from './components/SettingsModal';
import MeetingAlert from './components/MeetingAlert';
import { Search, Plus, LogOut, Share2, Menu } from 'lucide-react';
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
  const [bgImage, setBgImage] = useState(localStorage.getItem('datewise_bg') || '');

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

  const isUrl = bgImage && bgImage.startsWith('url');
  const mainStyle = bgImage ? {
    backgroundImage: isUrl ? bgImage : 'none',
    backgroundColor: isUrl ? 'transparent' : bgImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {};

  return (
    <div className="app-container" style={{ backgroundColor: bgImage ? 'transparent' : 'var(--bg-primary)' }}>
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
      />
      
      {/* Overlay para fechar o menu no celular */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className={`main-content ${bgImage ? 'has-bg' : ''}`} style={mainStyle}>
        <header className="header" style={{ backgroundColor: bgImage ? 'rgba(var(--bg-primary-rgb), 0.8)' : 'var(--bg-primary)', backdropFilter: bgImage ? 'blur(10px)' : 'none' }}>
          <div className="header-left">
            <button className="icon-btn mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="search-bar" style={{ backgroundColor: bgImage ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}>
              <Search size={18} className="text-secondary" />
              <input type="text" placeholder="Search" />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn">
              <Plus size={20} />
            </button>
            <div className="profile-wrapper" ref={profileMenuRef}>
              <div 
                className="profile-avatar" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ cursor: 'pointer' }}
              >
                <img src={session?.user?.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${session?.user?.id || 'default'}`} alt="Profile" />
              </div>
              
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <p className="profile-email">{session?.user?.email || 'user@example.com'}</p>
                  </div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
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
      </main>

      {showSettings && (
        <SettingsModal 
          session={session} 
          onClose={() => setShowSettings(false)} 
        />
      )}
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
      </Routes>
    </BrowserRouter>
  );
}
