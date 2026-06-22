import React, { useState, useEffect } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar({ activeView, onChangeView, onOpenSettings, isOpen, onClose }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }
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
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} color="white" />
          </div>
          <h2 style={{ marginLeft: '8px' }}>TaskForge</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => onChangeView('overview')}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </button>
        
        <button 
          className={`nav-item ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => onChangeView('board')}
        >
          <Calendar size={20} />
          <span>Board</span>
        </button>

        <button className="nav-item">
          <CheckSquare size={20} />
          <span>To do list</span>
        </button>
        
        <button 
          className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => onChangeView('calendar')}
        >
          <CalendarDays size={20} />
          <span>Calendário de Reuniões</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="theme-selector">
          <span className="text-sm font-medium">Theme</span>
          <div className="color-dots" style={{ cursor: 'pointer' }}>
            <span className="dot blue" onClick={() => handleThemeChange('var(--card-blue)')} />
            <span className="dot green" onClick={() => handleThemeChange('var(--card-green)')} />
            <span className="dot yellow" onClick={() => handleThemeChange('var(--card-yellow)')} />
            <span className="dot orange" onClick={() => handleThemeChange('var(--card-orange)')} />
            <span className="dot red" onClick={() => handleThemeChange('var(--card-red)')} />
            <span className="dot" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} onClick={() => handleThemeChange('')} />
          </div>
        </div>

        <button className="nav-item" onClick={toggleDarkMode}>
          <Moon size={20} />
          <span>Dark mode</span>
          <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}></div>
        </button>

        <button className="nav-item">
          <ChevronLeft size={20} />
          <span>Collapsed</span>
        </button>

        <div className="divider" />

        <button className="nav-item" onClick={onOpenSettings}>
          <Settings size={20} />
          <span>Settings</span>
        </button>

        <button className="nav-item text-danger" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
