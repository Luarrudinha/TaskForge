import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import Card from './Card';
import './List.css';

export default function List({ list, cards, index, onAddCard, onDeleteCard, onEditCard, session }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

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
          className="list-wrapper"
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className="list-header" {...provided.dragHandleProps}>
            <h3 className="list-title">{list.title}</h3>
          </div>
          
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                className={`list-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {cards.map((card, index) => (
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
