import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlignLeft, Send, Palette, Heart, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CardDetailModal.css';

const COLORS = ['gray', 'blue', 'green', 'orange', 'red', 'yellow'];

export default function CardDetailModal({ card, onClose, session }) {
  const [description, setDescription] = useState(card.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeColor, setActiveColor] = useState(card.color || 'gray');
  const [dueDate, setDueDate] = useState(card.due_date || '');

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${card.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `card_id=eq.${card.id}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [card.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
    setLoadingComments(false);
  };

  const handleSaveDescription = async () => {
    setIsEditingDesc(false);
    if (!card.id.startsWith('temp-')) {
      await supabase.from('cards').update({ description }).eq('id', card.id);
    }
  };

  const handleChangeColor = async (color) => {
    setActiveColor(color);
    if (!card.id.startsWith('temp-')) {
      await supabase.from('cards').update({ color }).eq('id', card.id);
    }
  };

  const handleSaveDueDate = async (date) => {
    setDueDate(date);
    if (!card.id.startsWith('temp-')) {
      await supabase.from('cards').update({ due_date: date || null }).eq('id', card.id);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || card.id.startsWith('temp-')) return;

    const commentData = {
      card_id: card.id,
      content: newComment.trim(),
      user_id: session.user.id,
      user_email: session.user.email,
      user_avatar: session.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`
    };

    setNewComment('');
    await supabase.from('comments').insert([commentData]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <h2 className="modal-title">{card.title}</h2>
            <span className="modal-subtitle">na lista atual</span>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="detail-sidebar-actions" style={{ display: 'flex', gap: '24px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cor:</span>
              {COLORS.map(c => (
                <button 
                  key={c}
                  onClick={() => handleChangeColor(c)}
                  className={`color-picker-btn color-${c}-dark ${activeColor === c ? 'active' : ''}`}
                  style={{
                    width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer',
                    border: activeColor === c ? '2px solid var(--text-primary)' : '2px solid transparent'
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><Calendar size={14} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/>Data (Opcional):</span>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => handleSaveDueDate(e.target.value)}
                style={{ 
                  backgroundColor: 'var(--bg-primary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  padding: '4px 8px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div className="detail-section">
            <div className="section-header">
              <AlignLeft size={18} />
              <h3>Descrição</h3>
            </div>
            {isEditingDesc ? (
              <div className="desc-edit">
                <textarea 
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  placeholder="Adicione uma descrição mais detalhada..."
                />
                <div className="desc-actions">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Salva automaticamente ao clicar fora.</span>
                </div>
              </div>
            ) : (
              <div 
                className={`desc-view ${!description ? 'empty' : ''}`} 
                onClick={() => setIsEditingDesc(true)}
              >
                {description || 'Adicionar uma descrição mais detalhada...'}
              </div>
            )}
          </div>

          <div className="detail-section chat-section">
            <div className="section-header">
              <MessageSquare size={18} />
              <h3>Bate-papo</h3>
            </div>
            
            <div className="comments-list">
              {loadingComments ? (
                <p className="text-secondary text-sm">Carregando...</p>
              ) : comments.length === 0 ? (
                <p className="text-secondary text-sm">Nenhum comentário ainda.</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      <img src={comment.user_avatar} alt="Avatar" />
                    </div>
                    <div className="comment-content">
                      <div className="comment-header-info">
                        <strong>{comment.user_email?.split('@')[0]}</strong>
                        <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      
                      <button 
                        className="comment-like-btn"
                        onClick={(e) => {
                          e.target.closest('button').classList.toggle('liked');
                        }}
                      >
                        <Heart size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="comment-input-area" onSubmit={handleSendComment}>
              <div className="comment-avatar">
                 <img src={session.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`} alt="Me" />
              </div>
              <div className="comment-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Escreva um comentário..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()} className="btn-send">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
