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
  const [newTime, setNewTime] = useState('09:00'); // Default time
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState('All events');

  useEffect(() => {
    if (session?.user?.id) {
      fetchMeetings();
    }
  }, [session, currentDate]);

  const fetchMeetings = async () => {
    setLoading(true);
    // Fetch all meetings for simplicity. In production, filter by date range.
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (data) setMeetings(data);
    setLoading(false);
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime) return;

    // Hack para evitar erro de schema no Supabase caso a coluna start_time não exista.
    // Salvamos a hora junto ao título: "10:30|Meu Titulo"
    const finalTitle = `${newTime}|${newTitle.trim()}`;

    const { data, error } = await supabase.from('meetings').insert([{
      title: finalTitle,
      meeting_date: newDate,
      user_id: session.user.id,
      color: ['blue', 'green', 'orange', 'purple'][Math.floor(Math.random() * 4)] // Matching pastel colors
    }]);

    if (!error) {
      setShowAddModal(false);
      setNewTitle('');
      setNewTime('09:00');
      setNewDate('');
      fetchMeetings();
    }
  };

  const handleDeleteMeeting = async (id, e) => {
    e.stopPropagation();
    await supabase.from('meetings').delete().eq('id', id);
    fetchMeetings();
  };

  // Funções de navegação da semana
  const prevWeek = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
  const nextWeek = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
  const goToToday = () => setCurrentDate(new Date());

  // Calcular dias da semana (Segunda a Sexta)
  const getWeekDays = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(start.setDate(diff));
    
    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(currentDate);
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9 AM to 5 PM

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h} ${ampm}`;
  };

  const formatDateString = (d) => {
    const offset = d.getTimezoneOffset()
    d = new Date(d.getTime() - (offset*60*1000))
    return d.toISOString().split('T')[0];
  };

  const parseEvent = (meeting) => {
    // If title has our time hack "HH:MM|Real Title"
    if (meeting.title && meeting.title.includes('|')) {
      const parts = meeting.title.split('|');
      const time = parts[0];
      const title = parts.slice(1).join('|');
      
      // Convert "10:30" to "10:30 AM"
      const [h, m] = time.split(':');
      const hourNum = parseInt(h);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
      const displayTime = `${displayHour}:${m} ${ampm}`;

      return { ...meeting, displayTitle: title, displayTime, hourStart: hourNum };
    }
    return { ...meeting, displayTitle: meeting.title, displayTime: '9:00 AM', hourStart: 9 };
  };

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <h1>Calendar</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Nova Call
        </button>
      </div>

      <div className="calendar-filters">
        {['All events', 'Shared', 'Public', 'Archived'].map(filter => (
          <button 
            key={filter} 
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="calendar-card">
        <div className="calendar-card-header">
          <div className="calendar-date-info">
            <div className="date-block">
              <span className="date-month">{new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
              <span className="date-day">{new Date().getDate()}</span>
            </div>
            <div className="date-text">
              <h2>{weekDays[0].toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <p>{weekDays[0].toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {weekDays[4].toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="calendar-navigation">
            <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={16} /></button>
            <button className="nav-btn today-btn" onClick={goToToday}>Today</button>
            <button className="nav-btn" onClick={nextWeek}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="weekly-grid">
          {/* Header row (Days) */}
          <div className="grid-header-row">
            <div className="time-col-header"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="day-col-header">
                <span className="day-name">{day.toLocaleString('en-US', { weekday: 'short' })}</span>
                <span className={`day-number ${day.toDateString() === new Date().toDateString() ? 'current' : ''}`}>
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>

          {/* Grid body (Hours and Cells) */}
          <div className="grid-body">
            {hours.map(hour => (
              <div key={hour} className="grid-row">
                <div className="time-cell">
                  <span>{formatHour(hour)}</span>
                </div>
                {weekDays.map(day => {
                  const dateStr = formatDateString(day);
                  const cellEvents = meetings
                    .map(parseEvent)
                    .filter(m => m.meeting_date === dateStr && m.hourStart === hour);

                  return (
                    <div key={`${dateStr}-${hour}`} className="day-cell">
                      {cellEvents.map(event => (
                        <div key={event.id} className={`event-card color-${event.color}`}>
                          <div className="event-title">{event.displayTitle}</div>
                          <div className="event-time">{event.displayTime}</div>
                          <button className="event-delete" onClick={(e) => handleDeleteMeeting(event.id, e)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Data</label>
                  <input 
                    type="date" 
                    required
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ width: '120px' }}>
                  <label>Horário</label>
                  <input 
                    type="time" 
                    required
                    value={newTime} 
                    onChange={e => setNewTime(e.target.value)} 
                  />
                </div>
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
