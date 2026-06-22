import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MeetingAlert({ session }) {
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkMeetings = async () => {
      // Calculate tomorrow's date string (YYYY-MM-DD)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('meeting_date', tomorrowStr)
        .limit(1);

      if (data && data.length > 0) {
        setUpcomingMeeting(data[0]);
      }
    };

    checkMeetings();
  }, [session]);

  if (!upcomingMeeting || !visible) return null;

  return (
    <div style={{
      backgroundColor: 'var(--card-orange)',
      border: '1px solid var(--card-orange-border)',
      padding: '12px 16px',
      margin: '0 24px 24px 24px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'var(--text-primary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={20} color="#C2410C" />
        <div>
          <strong style={{ fontSize: '14px' }}>Lembrete:</strong>
          <span style={{ fontSize: '14px', marginLeft: '6px' }}>Você tem a call "{upcomingMeeting.title}" marcada para amanhã!</span>
        </div>
      </div>
      <button 
        onClick={() => setVisible(false)}
        style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
