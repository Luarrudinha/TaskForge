import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Video, Edit2, Trash2, Bell, Minimize2, Check, X } from 'lucide-react';
import CardDetailModal from './CardDetailModal';
import './Card.css';

export default function Card({ card, index, listId, onDeleteCard, onEditCard, session }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteCard(listId, card.id);
    setShowMenu(false);
  };

  const handleEditSave = (e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onEditCard(listId, card.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = (e) => {
    e?.stopPropagation();
    setEditTitle(card.title);
    setIsEditing(false);
  };

  const handleCardClick = (e) => {
    // Only open if not editing and not clicking a button
    if (!isEditing && !e.target.closest('button')) {
      setShowDetailModal(true);
    }
  };

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            className={`card-container color-${card.color} ${snapshot.isDragging ? 'is-dragging' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleCardClick}
            style={{ ...provided.draggableProps.style, cursor: 'pointer' }}
          >
            <div className="card-header">
              <div className={`icon-badge color-${card.color}-dark`}>
                {card.color === 'orange' ? <Video size={14} color="white" /> : <div className="dot-icon" />}
              </div>
            </div>
            
            <div className="card-body">
              {isEditing ? (
                <div className="edit-card-form" onClick={e => e.stopPropagation()}>
                  <input 
                    autoFocus
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                  />
                  <div className="edit-actions">
                    <button onClick={handleEditSave} className="text-success"><Check size={16} /></button>
                    <button onClick={handleEditCancel} className="text-danger"><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <h4 className="card-title">{card.title}</h4>
              )}
              <p className="card-time">{card.time}</p>
            </div>

            <div className="card-footer">
              <div className="card-users">
                {card.users?.map((user, i) => (
                  <div key={i} className="user-avatar" style={{ zIndex: 10 - i }}>
                    <img src={`https://i.pravatar.cc/150?u=${user}`} alt="User" />
                  </div>
                ))}
                {card.users?.length > 0 && (
                  <div className="user-avatar more-users">
                    <span>12+</span>
                  </div>
                )}
              </div>

              <div className="card-actions-wrapper" ref={menuRef}>
                <button 
                  className="action-btn"
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMenu(!showMenu);
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>

                {showMenu && (
                  <div 
                    className="card-menu" 
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <button className="menu-item" onClick={() => setShowMenu(false)}>
                      <Bell size={14} /> Set reminder
                    </button>
                    <button className="menu-item" onClick={() => setShowMenu(false)}>
                      <Minimize2 size={14} /> Minimize
                    </button>
                    <button className="menu-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="menu-item text-danger" onClick={handleDelete}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {showDetailModal && (
        <CardDetailModal 
          card={card} 
          session={session} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}
    </>
  );
}
