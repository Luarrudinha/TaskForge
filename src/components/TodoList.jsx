import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Check, CheckSquare } from 'lucide-react';
import './TodoList.css';

export default function TodoList({ session }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodos();
    }
  }, [session]);

  const fetchTodos = async () => {
    setLoading(true);
    // Fetch personal cards (list_id is null)
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .is('list_id', null)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      setTodos(data);
    }
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const taskTitle = newTask.trim();
    setNewTask('');

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const newTodo = {
      id: tempId,
      title: taskTitle,
      color: 'gray', // 'completed' will indicate checked
      user_id: session.user.id
    };
    
    setTodos([newTodo, ...todos]);

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert([{ 
          title: taskTitle,
          user_id: session.user.id,
          // list_id is intentionally omitted/null
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update temp id with real id
      setTodos(current => current.map(t => t.id === tempId ? data : t));
    } catch (err) {
      console.error('Error adding todo:', err);
      // Revert on error
      setTodos(current => current.filter(t => t.id !== tempId));
    }
  };

  const toggleTodo = async (id, currentColor) => {
    const isCompleted = currentColor === 'completed';
    const newColor = isCompleted ? 'gray' : 'completed';

    // Optimistic UI
    setTodos(todos.map(t => t.id === id ? { ...t, color: newColor } : t));

    if (!id.startsWith('temp-')) {
      const { error } = await supabase
        .from('cards')
        .update({ color: newColor })
        .eq('id', id);
        
      if (error) {
        console.error('Error toggling todo:', error);
        // Revert on error
        setTodos(todos.map(t => t.id === id ? { ...t, color: currentColor } : t));
      }
    }
  };

  const deleteTodo = async (id) => {
    // Optimistic UI
    const previousTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));

    if (!id.startsWith('temp-')) {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting todo:', error);
        // Revert on error
        setTodos(previousTodos);
      }
    }
  };

  if (loading && todos.length === 0) {
    return (
      <div className="todo-container" style={{ alignItems: 'center' }}>
        <p style={{color: 'var(--text-secondary)'}}>Carregando tarefas...</p>
      </div>
    );
  }

  const completedCount = todos.filter(t => t.color === 'completed').length;

  return (
    <div className="todo-container">
      <div className="todo-content">
        <div className="todo-header">
          <h2>Minhas Tarefas Pessoais</h2>
          <p>
            {todos.length === 0 
              ? 'Você não tem tarefas ainda.' 
              : `${completedCount} de ${todos.length} tarefas concluídas`
            }
          </p>
        </div>

        <form onSubmit={handleAddTask} className="todo-input-container">
          <Plus size={20} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Adicionar nova tarefa... (Pressione Enter)" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
        </form>

        <div className="todo-list">
          {todos.map(todo => {
            const isCompleted = todo.color === 'completed';
            return (
              <div key={todo.id} className="todo-item">
                <div className="todo-item-left" onClick={() => toggleTodo(todo.id, todo.color)} style={{cursor: 'pointer'}}>
                  <div className={`todo-checkbox ${isCompleted ? 'checked' : ''}`}>
                    {isCompleted && <Check size={14} color="white" />}
                  </div>
                  <span className={`todo-title ${isCompleted ? 'completed' : ''}`}>
                    {todo.title}
                  </span>
                </div>
                <button 
                  className="todo-delete-btn" 
                  onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                  title="Excluir tarefa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
