import React, { useState, useEffect } from 'react';
import './CalendarView.css';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CalendarView({ session }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // States for adding a new meeting
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  
  useEffect(() => {
    if (session?.user?.id) {
      fetchMeetings();
    }
  }, [session, currentDate]);

  const fetchMeetings = async () => {
    setLoading(true);
    // Get year and month of currentDate
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Simplification: fetch all meetings for the user (in a real app, filter by month)
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (data) setMeetings(data);
    setLoading(false);
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const { data, error } = await supabase.from('meetings').insert([{
      title: newTitle,
      meeting_date: newDate,
      user_id: session.user.id,
      color: ['blue', 'green', 'orange', 'red'][Math.floor(Math.random() * 4)]
    }]);

    if (!error) {
      setShowAddModal(false);
      setNewTitle('');
      setNewDate('');
      fetchMeetings();
    }
  };

  const handleDeleteMeeting = async (id, e) => {
    e.stopPropagation();
    await supabase.from('meetings').delete().eq('id', id);
    fetchMeetings();
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const dates = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    dates.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatCurrentDateString = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format YYYY-MM-DD
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="calendar-view-container">
      <div className="calendar-header">
        <h2>{monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}</h2>
        <div className="calendar-nav">
          <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <button className="btn-primary" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          <button className="icon-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          <button className="btn-primary flex items-center gap-2 ml-4" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Nova Call
          </button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {days.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        
        {dates.map((date, i) => {
          const dateStr = date ? formatCurrentDateString(date) : null;
          const dayMeetings = meetings.filter(m => m.meeting_date === dateStr);
          
          return (
            <div key={i} className={`calendar-cell ${date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'active' : ''} ${!date ? 'empty' : ''}`}>
              {date && <span className="date-number">{date}</span>}
              
              <div className="calendar-events-container">
                {dayMeetings.map(meeting => (
                  <div key={meeting.id} className={`calendar-event color-${meeting.color}`}>
                    <span className="event-dot"></span> 
                    <span className="event-title">{meeting.title}</span>
                    <button className="event-delete" onClick={(e) => handleDeleteMeeting(meeting.id, e)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-meeting-modal" onClick={e => e.stopPropagation()}>
            <h3>Marcar Nova Call</h3>
            <form onSubmit={handleAddMeeting}>
              <div className="form-group">
                <label>Título da Reunião</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="Ex: Reunião de Alinhamento"
                />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input 
                  type="date" 
                  required
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Call</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
