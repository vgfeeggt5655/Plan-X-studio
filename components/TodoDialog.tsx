import React, { useEffect, useState } from 'react';
import { ToDoItem, User } from '../types';
import { getUserTodos, updateUserTodos } from '../services/googleSheetService';
import { useAuth } from '../contexts/AuthContext';

interface TodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<ToDoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadTodos = async () => {
      setLoading(true);
      let userTodos = await getUserTodos(user.id);

      // حذف المهام المنجزة من امبارح ونقل المهام غير المنجزة من امبارح لليوم
      const updatedTodos: ToDoItem[] = [];
      userTodos.forEach((t) => {
        if (t.date === yesterdayStr) {
          if (!t.completed) {
            updatedTodos.push({ ...t, date: todayStr });
          }
        } else if (t.date === todayStr) {
          updatedTodos.push(t);
        }
      });

      setTodos(updatedTodos);
      await updateUserTodos(user, updatedTodos);
      setLoading(false);
    };

    loadTodos();
  }, [isOpen, user]);

  const toggleComplete = async (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    if (user) await updateUserTodos(user, updated);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-color rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">Today's Tasks</h2>

        {loading ? (
          <div className="text-center text-text-secondary">Loading...</div>
        ) : todos.length === 0 ? (
          <div className="text-text-secondary">No tasks for today!</div>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {todos.map((t) => (
              <li
                key={t.id}
                className={`flex items-center justify-between p-2 rounded-md border ${
                  !t.completed && t.date === todayStr && t.id.includes('yesterday') ? 'border-red-500 bg-red-100' : 'border-gray-300'
                }`}
              >
                <span className={`${t.completed ? 'line-through text-gray-400' : ''}`}>{t.task}</span>
                <button
                  onClick={() => toggleComplete(t.id)}
                  className={`px-2 py-1 text-sm rounded ${
                    t.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.completed ? 'Done' : 'Mark'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-text-primary rounded-md hover:bg-slate-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
