import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Layout, Trash2 } from 'lucide-react';
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
    const { data: boardsData, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    
    if (boardsData) {
      const boardIds = boardsData.map(b => b.id);
      let allMembers = [];
      
      try {
        const { data: membersData, error: memError } = await supabase
          .from('board_members')
          .select('board_id, user_email')
          .in('board_id', boardIds);
          
        if (!memError && membersData) {
          allMembers = membersData;
        }
      } catch (err) {
        // Ignora caso a tabela não exista ainda
      }

      const enrichedBoards = boardsData.map(board => {
        const boardMembers = allMembers.filter(m => m.board_id === board.id).map(m => m.user_email);
        return {
          ...board,
          members: [...new Set([session.user.email, ...boardMembers])]
        };
      });

      setBoards(enrichedBoards);
    }
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

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir este grupo e todas as suas tarefas?")) {
      try {
        setBoards(prevBoards => prevBoards.filter(b => b.id !== boardId));

        const { data: lists } = await supabase.from('lists').select('id').eq('board_id', boardId);
        if (lists && lists.length > 0) {
          const listIds = lists.map(l => l.id);
          await supabase.from('cards').delete().in('list_id', listIds);
          await supabase.from('lists').delete().eq('board_id', boardId);
        }
        await supabase.from('board_members').delete().eq('board_id', boardId);
        await supabase.from('boards').delete().eq('id', boardId);
      } catch (err) {
        console.error('Error deleting board:', err);
      }
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
            <div className="board-card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>{board.title}</h3>
              <button 
                onClick={(e) => handleDeleteBoard(e, board.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Excluir Grupo"
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="board-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} />
                <span>Gerenciar Tarefas</span>
              </div>
              
              {board.members && board.members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {board.members.slice(0, 4).map((email, i) => (
                    <div 
                      key={i} 
                      title={email}
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        border: '2px solid var(--bg-secondary)', 
                        marginLeft: i > 0 ? '-8px' : '0',
                        zIndex: 10 - i,
                        backgroundColor: '#3C64F4'
                      }}
                    >
                      <img 
                        src={session?.user?.email === email ? session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${email?.charAt(0).toUpperCase() || 'U'}&background=3C64F4&color=fff&size=150` : `https://ui-avatars.com/api/?name=${email?.charAt(0).toUpperCase() || 'U'}&background=3C64F4&color=fff&size=150`} 
                        alt="User" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  ))}
                  {board.members.length > 4 && (
                    <div style={{
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: '2px solid var(--bg-secondary)', 
                        marginLeft: '-8px',
                        zIndex: 5,
                        backgroundColor: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                    }}>
                      +{board.members.length - 4}
                    </div>
                  )}
                </div>
              )}
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
