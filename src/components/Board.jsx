import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Share2, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import List from './List';
import './Board.css';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

export default function Board({ session, sharedBoardId, activeBoardId }) {
  const [data, setData] = useState({ lists: {}, listOrder: [] });
  const [loading, setLoading] = useState(true);
  const [boardId, setBoardId] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [boardTitle, setBoardTitle] = useState('Meu Quadro');
  const [boardMembers, setBoardMembers] = useState([]);
  const [expandedListId, setExpandedListId] = useState(null);

  const prevBoardIdRef = React.useRef(activeBoardId);
  const prevSharedBoardIdRef = React.useRef(sharedBoardId);
  const isInitialLoadRef = React.useRef(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const isBoardSwitch = prevBoardIdRef.current !== activeBoardId || prevSharedBoardIdRef.current !== sharedBoardId;
    prevBoardIdRef.current = activeBoardId;
    prevSharedBoardIdRef.current = sharedBoardId;

    const fetchBoardData = async () => {
      if (isBoardSwitch || isInitialLoadRef.current) {
        setLoading(true);
      }
      try {
        let currentBoard = null;

        // 1. Fetch specific board if sharedBoardId or activeBoardId is present
        const targetId = sharedBoardId || activeBoardId;
        
        if (targetId) {
          // If accessing via shared link, try to join the board
          if (sharedBoardId) {
            try {
              await supabase.from('board_members').insert([{
                board_id: sharedBoardId,
                user_email: session.user.email
              }]);
            } catch (e) {
              // Ignore errors (already a member, etc)
            }
          }

          const { data: boards } = await supabase
            .from('boards')
            .select('*')
            .eq('id', targetId)
            .limit(1);
          currentBoard = boards?.[0];
        }

        if (!currentBoard && !targetId) {
          let { data: boards } = await supabase
            .from('boards')
            .select('*')
            .eq('user_id', session.user.id)
            .limit(1);

          currentBoard = boards?.[0];

          if (!currentBoard) {
            const { data: newBoard, error: boardError } = await supabase
              .from('boards')
              .insert([{ title: 'Meu Quadro', user_id: session.user.id }])
              .select()
              .single();
              
            if (boardError) throw boardError;
            currentBoard = newBoard;
            
            // Create default lists
            const defaultLists = ['A Fazer', 'Em Andamento', 'Concluído'];
            for (let i = 0; i < defaultLists.length; i++) {
              await supabase.from('lists').insert([{
                title: defaultLists[i],
                board_id: currentBoard.id,
                position: i
              }]);
            }
          }
        }

        if (!currentBoard) {
          console.error("Board not found");
          setLoading(false);
          return;
        }
        
        setBoardId(currentBoard.id);
        setBoardTitle(currentBoard.title);

        // Fetch board members for avatars
        try {
          const { data: members } = await supabase
            .from('board_members')
            .select('user_email')
            .eq('board_id', currentBoard.id);
          
          if (members) {
            setBoardMembers(members.map(m => m.user_email));
          }
        } catch (err) {
          console.error('Error fetching members:', err);
        }

        // 2. Fetch lists and cards
        const { data: lists } = await supabase
          .from('lists')
          .select('*')
          .eq('board_id', currentBoard.id)
          .order('position', { ascending: true });

        const listIds = lists.map(l => l.id);

        const { data: cards } = await supabase
          .from('cards')
          .select('*')
          .in('list_id', listIds)
          .order('position', { ascending: true });

        // Transform into our state structure
        const stateLists = {};
        const stateListOrder = [];

        lists.forEach(list => {
          stateLists[list.id] = {
            id: list.id,
            title: list.title,
            cards: cards.filter(c => c.list_id === list.id).map(c => ({
              ...c,
              time: 'Tarefa',
              color: c.color || 'gray',
              users: []
            }))
          };
          stateListOrder.push(list.id);
        });

        setData({ lists: stateLists, listOrder: stateListOrder });
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    fetchBoardData();

  }, [session, sharedBoardId, activeBoardId, refreshCounter]);

  // Handle Realtime separately so it depends on boardId
  useEffect(() => {
    if (!boardId) return;

    // Set up Realtime subscriptions scoped to this board
    const channel = supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        setRefreshCounter(prev => prev + 1);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        setRefreshCounter(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const newListOrder = Array.from(data.listOrder);
      newListOrder.splice(source.index, 1);
      newListOrder.splice(destination.index, 0, draggableId);
      setData({ ...data, listOrder: newListOrder });
      // Would need to update position in DB here for lists
      return;
    }

    const startList = data.lists[source.droppableId];
    const finishList = data.lists[destination.droppableId];

    if (startList === finishList) {
      const newCards = Array.from(startList.cards);
      const [movedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, movedCard);

      const newList = { ...startList, cards: newCards };
      setData({
        ...data,
        lists: { ...data.lists, [newList.id]: newList },
      });
      // Would update positions in DB here
      return;
    }

    // Moving from one list to another
    const startCards = Array.from(startList.cards);
    const [movedCard] = startCards.splice(source.index, 1);
    const newStartList = { ...startList, cards: startCards };

    const finishCards = Array.from(finishList.cards);
    finishCards.splice(destination.index, 0, movedCard);
    const newFinishList = { ...finishList, cards: finishCards };

    setData({
      ...data,
      lists: {
        ...data.lists,
        [newStartList.id]: newStartList,
        [newFinishList.id]: newFinishList,
      },
    });

    // Check if moved to "Concluído"
    if (finishList.title.toLowerCase().includes('concluído')) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Update DB
    await supabase
      .from('cards')
      .update({ list_id: finishList.id, position: destination.index })
      .eq('id', draggableId);
  };

  const handleAddCard = async (listId, cardTitle) => {
    if (!session?.user?.id) return;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newCard = {
      id: tempId,
      title: cardTitle,
      time: 'Nova Tarefa',
      color: 'gray',
      users: [],
    };

    const list = data.lists[listId];
    const newCards = [...list.cards, newCard];
    const newList = { ...list, cards: newCards };

    setData({
      ...data,
      lists: {
        ...data.lists,
        [listId]: newList,
      },
    });

    // DB Insert
    try {
      const { data: insertedCard, error } = await supabase
        .from('cards')
        .insert([{ 
          title: cardTitle, 
          list_id: listId, 
          user_id: session.user.id,
          position: newCards.length
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update with real ID (could let realtime handle this too)
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (listId, cardId) => {
    // Optimistic
    const list = data.lists[listId];
    const newCards = list.cards.filter(card => card.id !== cardId);
    const newList = { ...list, cards: newCards };

    setData({
      ...data,
      lists: {
        ...data.lists,
        [listId]: newList,
      },
    });

    // DB Delete
    if (!cardId.startsWith('temp-')) {
      await supabase.from('cards').delete().eq('id', cardId);
    }
  };

  const handleEditCard = async (listId, cardId, newTitle) => {
    // Optimistic
    const list = data.lists[listId];
    const newCards = list.cards.map(card => {
      if (card.id === cardId) {
        return { ...card, title: newTitle };
      }
      return card;
    });
    const newList = { ...list, cards: newCards };

    setData({
      ...data,
      lists: {
        ...data.lists,
        [listId]: newList,
      },
    });

    // DB Update
    if (!cardId.startsWith('temp-')) {
      await supabase.from('cards').update({ title: newTitle }).eq('id', cardId);
    }
  };

  const handleShare = () => {
    // Altere este link para o link real onde o seu site vai ficar hospedado!
    const productionUrl = 'https://taskforge-inpe.vercel.app'; 
    const baseUrl = window.location.hostname === 'localhost' ? productionUrl : window.location.origin;
    
    const url = `${baseUrl}/?board=${boardId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="board-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Carregando Quadro...</div>;
  }

  return (
    <div className="board-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: '24px', overflowX: 'auto' }}>
      <div className="board-sub-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{new Date().toLocaleString('pt-BR', { month: 'long' })}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Board</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{boardTitle}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="board-users" style={{ display: 'flex', alignItems: 'center' }}>
            {[...new Set([session?.user?.email, ...boardMembers])].filter(Boolean).map((email, i) => (
              <div 
                key={i} 
                className="user-avatar" 
                style={{ 
                  zIndex: 10 - i, 
                  marginLeft: i > 0 ? '-12px' : '0',
                  border: '2px solid var(--bg-primary)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                title={email}
              >
                <img 
                  src={session?.user?.email === email ? session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${email?.charAt(0).toUpperCase() || 'U'}&background=3C64F4&color=fff&size=150` : `https://ui-avatars.com/api/?name=${email?.charAt(0).toUpperCase() || 'U'}&background=3C64F4&color=fff&size=150`} 
                  alt="User" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleShare}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '500', transition: 'all 0.2s' }}
          >
            {copied ? <Check size={16} color="#00C49F" /> : <Share2 size={16} />}
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>

          <button 
            onClick={() => {
              if (data.listOrder.length > 0) {
                const firstListId = data.listOrder[0];
                const title = prompt('Nome da Nova Tarefa:');
                if (title) handleAddCard(firstListId, title);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', backgroundColor: '#3C64F4', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', fontWeight: '600', boxShadow: '0 4px 14px rgba(60, 100, 244, 0.4)', transition: 'transform 0.2s' }}
          >
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {Object.values(data.lists).reduce((acc, list) => acc + list.cards.length, 0)} Cartões no total
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="board-container"
              style={{ padding: 0 }}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {data.listOrder
                .filter(listId => !expandedListId || listId === expandedListId)
                .map((listId, index) => {
                const list = data.lists[listId];
                return (
                  <List
                    key={list.id}
                    list={list}
                    cards={list.cards}
                    index={index}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                    onEditCard={handleEditCard}
                    session={session}
                    isExpanded={expandedListId === list.id}
                    onToggleExpand={() => setExpandedListId(expandedListId === list.id ? null : list.id)}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
