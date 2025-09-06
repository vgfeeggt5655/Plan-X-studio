// src/components/TodoListDialog.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Todo } from '../types';
import { getUserTodos, updateUserTodos } from '../services/authService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const groupByDate = (todos: Todo[]) => {
  const map: Record<string, Todo[]> = {};
  todos.forEach(t => {
    const key = t.date ? t.date.slice(0, 10) : 'No date';
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  return Object.keys(map)
    .sort((a, b) => (a > b ? -1 : 1))
    .reduce((acc, k) => ({ ...acc, [k]: map[k] }), {});
};

const TodoListDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayISO());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState(todayISO());

  useEffect(() => {
    if (isOpen && user?.id) {
      getUserTodos(user.id).then(setTodos).catch(console.error);
    }
  }, [isOpen, user]);

  const grouped = useMemo(() => groupByDate(todos), [todos]);

  const persist = async (next: Todo[]) => {
    setTodos(next);
    if (user?.id) {
      await updateUserTodos(user.id, next);
    }
  };

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    const item: Todo = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: newDate,
      status: 'pending',
      rating: 0,
      createdAt: new Date().toISOString(),
    };
    setNewTitle('');
    setNewDate(todayISO());
    await persist([item, ...todos]);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const next = todos.map(t =>
      t.id === editingId ? { ...t, title: editTitle, date: editDate } : t
    );
    setEditingId(null);
    await persist(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">My Todo</h3>
          <button onClick={onClose} className="text-sm">Close</button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="عنوان المهمة"
            className="flex-1 p-2 border rounded"
          />
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button onClick={addTodo} className="px-4 py-2 bg-green-500 text-white rounded">
            Add
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="font-semibold mb-2">{date}</div>
              {items.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 border rounded mb-1">
                  {editingId === t.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        className="flex-1 p-1 border rounded"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                      />
                      <input
                        type="date"
                        className="p-1 border rounded"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                      />
                      <button onClick={saveEdit} className="px-2 bg-blue-500 text-white rounded">
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={t.status === 'done' ? 'line-through' : ''}>
                        {t.title}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => persist(
                          todos.map(td => td.id === t.id ? { ...td, status: td.status === 'done' ? 'pending' : 'done' } : td)
                        )}>✔</button>
                        <button onClick={() => { setEditingId(t.id!); setEditTitle(t.title); setEditDate(t.date); }}>✏</button>
                        <button onClick={() => persist(todos.filter(td => td.id !== t.id))}>🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoListDialog;
