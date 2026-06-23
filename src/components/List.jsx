import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, MoreHorizontal, ClipboardList, Maximize2, Minimize2 } from 'lucide-react';
import Card from './Card';
import './List.css';

export default function List({ list, cards, index, onAddCard, onDeleteCard, onEditCard, session, isExpanded, onToggleExpand }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const visibleCards = isExpanded ? cards : cards.slice(0, 8);
  const hasMore = cards.length > 8;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <div
          className={`list-wrapper ${isExpanded ? 'expanded' : ''}`}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className="list-header" {...provided.dragHandleProps}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (hasMore || isExpanded) ? 'pointer' : 'default', flex: 1 }} 
              onClick={() => { if (hasMore || isExpanded) onToggleExpand(); }}
              title={isExpanded ? "Restaurar coluna" : (hasMore ? "Expandir coluna" : "")}
            >
              <ClipboardList size={18} color="var(--text-secondary)" />
              <h3 className="list-title">{list.title} ({cards.length})</h3>
              {(hasMore || isExpanded) && (
                <div style={{ marginLeft: '4px', color: 'var(--text-secondary)', display: 'flex' }}>
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <Plus size={18} style={{ cursor: 'pointer' }} onClick={() => setIsAdding(true)} />
              <MoreHorizontal size={18} style={{ cursor: 'pointer' }} />
            </div>
          </div>
          
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                className={`list-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {visibleCards.map((card, index) => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    index={index} 
                    listId={list.id}
                    onDeleteCard={onDeleteCard}
                    onEditCard={onEditCard}
                    session={session}
                  />
                ))}
                {provided.placeholder}

                {isAdding ? (
                  <form onSubmit={handleAddSubmit} className="add-card-form">
                    <textarea
                      autoFocus
                      placeholder="Insira o título da tarefa..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddSubmit(e);
                        }
                      }}
                    />
                    <div className="add-card-actions">
                      <button type="submit" className="btn-primary">Adicionar</button>
                      <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>
                        <X size={20} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className="add-card-btn" onClick={() => setIsAdding(true)}>
                    <Plus size={16} /> Adicionar Tarefa
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
