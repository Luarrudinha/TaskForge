import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import { 
  Calendar, 
  Search, 
  CheckSquare, 
  Moon, 
  Settings, 
  HelpCircle,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CalendarDays,
  ClipboardList,
  BarChart2,
  Edit2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar({ activeView, onChangeView, onOpenSettings, isOpen, onClose, session, onEditPhoto, onLogout, isUploading }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme-mode', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleThemeChange = (colorValue) => {
    localStorage.setItem('datewise_bg', colorValue);
    window.dispatchEvent(new CustomEvent('bg-changed', { detail: colorValue }));
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} color="white" />
          </div>
          <h2 className="hide-on-collapse" style={{ marginLeft: '8px' }}>TaskForge</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title hide-on-collapse" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>Main</div>
        
        <button 
          className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => onChangeView('overview')}
        >
          <LayoutDashboard size={20} />
          <span className="hide-on-collapse">Overview</span>
        </button>
        
        <button 
          className={`nav-item ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => onChangeView('board')}
        >
          <Calendar size={20} />
          <span className="hide-on-collapse">Board</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'todo' ? 'active' : ''}`}
          onClick={() => onChangeView('todo')}
        >
          <CheckSquare size={20} />
          <span className="hide-on-collapse">To do list</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => onChangeView('analytics')}
        >
          <BarChart2 size={20} />
          <span className="hide-on-collapse">Estatísticas</span>
        </button>
        
        <button 
          className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => onChangeView('calendar')}
        >
          <CalendarDays size={20} />
          <span className="hide-on-collapse">Schedule</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={toggleDarkMode}>
          <Moon size={20} />
          <span className="hide-on-collapse">Dark mode</span>
          <div className={`toggle-switch hide-on-collapse ${isDarkMode ? 'active' : ''}`}></div>
        </button>

        <button className="nav-item" onClick={onOpenSettings}>
          <Settings size={20} />
          <span className="hide-on-collapse">Settings</span>
        </button>

        <button className="nav-item" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          <span className="hide-on-collapse">{isCollapsed ? 'Expand' : 'Collapsed'}</span>
        </button>

        <div className="divider" />

        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          {showProfileDropdown && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '8px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100 }}>
              <button 
                className="nav-item" 
                style={{ padding: '8px 12px', borderRadius: '8px', margin: 0, width: '100%', justifyContent: 'flex-start' }}
                onClick={() => { setShowProfileDropdown(false); onOpenSettings(); }}
              >
                <Settings size={16} /> <span style={{ marginLeft: '8px' }}>Configurações</span>
              </button>
              <button 
                className="nav-item" 
                style={{ padding: '8px 12px', borderRadius: '8px', margin: 0, width: '100%', justifyContent: 'flex-start' }}
                onClick={() => { setShowProfileDropdown(false); onEditPhoto(); }}
                disabled={isUploading}
              >
                <Edit2 size={16} /> <span style={{ marginLeft: '8px' }}>{isUploading ? 'Salvando...' : 'Editar Foto'}</span>
              </button>
              <button 
                className="nav-item text-danger" 
                style={{ padding: '8px 12px', borderRadius: '8px', margin: 0, width: '100%', justifyContent: 'flex-start', color: '#E53E3E' }}
                onClick={() => { setShowProfileDropdown(false); onLogout(); }}
              >
                <LogOut size={16} /> <span style={{ marginLeft: '8px' }}>Sair</span>
              </button>
            </div>
          )}

          <div className="sidebar-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', marginTop: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <img 
              src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.charAt(0).toUpperCase() || 'U'}&background=3C64F4&color=fff&size=150`} 
              alt="User" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            {!isCollapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{session?.user?.email?.split('@')[0] || 'My Profile'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Configurações</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
