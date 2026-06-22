import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Layout } from 'lucide-react';
import './Overview.css';

export default function Overview({ session, onSelectBoard }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchBoards();
    }
  }, [session]);

  const fetchBoards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    
    if (data) setBoards(data);
    setLoading(false);
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const { data: newBoard, error } = await supabase
        .from('boards')
        .insert([{ title: newBoardTitle.trim(), user_id: session.user.id }])
        .select()
        .single();
      
      if (error) throw error;

      // Create default lists
      const defaultLists = ['A Fazer', 'Em Andamento', 'Concluído'];
      const listInserts = defaultLists.map((title, index) => ({
        title,
        board_id: newBoard.id,
        position: index
      }));

      await supabase.from('lists').insert(listInserts);

      setNewBoardTitle('');
      setIsCreating(false);
      fetchBoards();
    } catch (err) {
      console.error('Error creating board:', err);
    }
  };

  if (loading) {
    return <div className="overview-container"><p style={{color: 'var(--text-secondary)'}}>Carregando seus grupos...</p></div>;
  }

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <Layout size={28} color="var(--text-primary)" />
          <h2>Meus Grupos (Setores)</h2>
        </div>
      </div>

      <div className="boards-grid">
        {boards.map(board => (
          <div 
            key={board.id} 
            className="board-card"
            onClick={() => onSelectBoard(board.id)}
          >
            <div className="board-card-content">
              <h3>{board.title}</h3>
            </div>
            <div className="board-card-footer">
              <Users size={14} />
              <span>Gerenciar Tarefas</span>
            </div>
          </div>
        ))}

        {isCreating ? (
          <form className="board-card create-form" onSubmit={handleCreateBoard}>
            <input 
              autoFocus
              type="text" 
              placeholder="Nome do Setor..." 
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
            />
            <div className="create-actions">
              <button type="submit" className="btn-save">Criar</button>
              <button type="button" className="btn-cancel" onClick={() => setIsCreating(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="board-card new-board-btn" onClick={() => setIsCreating(true)}>
            <Plus size={24} />
            <span>Criar Novo Grupo</span>
          </div>
        )}
      </div>
    </div>
  );
}
