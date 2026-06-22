import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Share2, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import List from './List';
import './Board.css';
import { supabase } from '../lib/supabase';

export default function Board({ session, sharedBoardId, activeBoardId }) {
  const [data, setData] = useState({ lists: {}, listOrder: [] });
  const [loading, setLoading] = useState(true);
  const [boardId, setBoardId] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [boardTitle, setBoardTitle] = useState('Meu Quadro');

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchBoardData = async () => {
      setLoading(true);
      try {
        let currentBoard = null;

        // 1. Fetch specific board if sharedBoardId or activeBoardId is present
        const targetId = sharedBoardId || activeBoardId;
        
        if (targetId) {
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
              id: c.id,
              title: c.title,
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
      }
    };

    fetchBoardData();

  }, [session, sharedBoardId, refreshCounter]);

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
    const url = `${window.location.origin}/?board=${boardId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="board-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Carregando Quadro...</div>;
  }

  return (
    <div className="board-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: '24px', overflowX: 'auto' }}>
      <div className="board-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{boardTitle}</h2>
        <button 
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          {copied ? <Check size={16} color="green" /> : <Share2 size={16} />}
          {copied ? 'Link Copiado!' : 'Compartilhar'}
        </button>
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
              {data.listOrder.map((listId, index) => {
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
