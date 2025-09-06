// src/components/TodoListDialog.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import { Todo } from '../types';
import { getUserTodos, updateUserTodos } from '../services/authService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

const genId = () => Date.now().toString() + Math.random().toString(36).slice(2);

const TodoListDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false); // for add/edit/delete actions
  const [currentDay, setCurrentDay] = useState<string>(isoDate());
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load todos when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const raw = await getUserTodos(String(user.id));
        // normalize
        const normalized: Todo[] = (raw || []).map((t: any) => ({
          id: t.id ? String(t.id) : genId(),
          title: String(t.title ?? t.task ?? ''),
          date: t.date ? String(t.date).slice(0, 10) : isoDate(),
          status: t.status === 'done' ? 'done' : 'pending',
          rating: t.rating ? Number(t.rating) : 0,
          notes: t.notes || '',
          createdAt: t.createdAt || new Date().toISOString()
        }));

        // Smart processing:
        // - remove past tasks that are done
        // - move past pending tasks to today and mark overdue flag locally
        const today = isoDate();
        const processed: Todo[] = [];
        normalized.forEach(t => {
          if (t.status === 'done' && t.date < today) {
            // drop old completed tasks
            return;
          }
          if (t.status !== 'done' && t.date < today) {
            // move to today
            processed.push({ ...t, date: today });
            return;
          }
          processed.push(t);
        });

        // Persist the processed list back to sheet if it changed
        const datesChanged = JSON.stringify(processed) !== JSON.stringify(normalized);
        setTodos(processed);
        setCurrentDay(today);
        if (datesChanged) {
          // best-effort save; don't block UI for too long
          try { await updateUserTodos(String(user.id), processed); } catch (e) { console.error('save processed todos failed', e); }
        }
      } catch (err) {
        console.error('Failed loading todos', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, user]);

  // days list for navigation (ensure today present)
  const days = useMemo(() => {
    const setDates = new Set<string>();
    setDates.add(isoDate()); // ensure today present
    todos.forEach(t => setDates.add(t.date || isoDate()));
    const arr = Array.from(setDates);
    // put today first, then the rest sorted descending (recent first)
    const today = isoDate();
    const rest = arr.filter(d => d !== today).sort((a, b) => (a > b ? -1 : 1));
    return [today, ...rest];
  }, [todos]);

  // ensure currentDay is valid
  useEffect(() => {
    if (!days.includes(currentDay)) setCurrentDay(days[0] || isoDate());
  }, [days, currentDay]);

  const dayTasks = useMemo(() => todos.filter(t => (t.date || isoDate()) === currentDay), [todos, currentDay]);

  const dayProgress = useMemo(() => {
    if (dayTasks.length === 0) return 0;
    const done = dayTasks.filter(t => t.status === 'done').length;
    return Math.round((done / dayTasks.length) * 100);
  }, [dayTasks]);

  // save helper
  const saveTodos = async (next: Todo[]) => {
    setProcessing(true);
    setTodos(next);
    try {
      if (user?.id) await updateUserTodos(String(user.id), next);
    } catch (e) {
      console.error('Failed to save todos', e);
    } finally {
      // small delay for UX feel
      setTimeout(() => setProcessing(false), 250);
    }
  };

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const item: Todo = {
      id: genId(),
      title,
      date: currentDay,
      status: 'pending',
      rating: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };
    await saveTodos([item, ...todos]);
    setNewTitle('');
  };

  const removeTask = async (id?: string) => {
    if (!id) return;
    await saveTodos(todos.filter(t => t.id !== id));
  };

  const toggleDone = async (id?: string) => {
    if (!id) return;
    await saveTodos(todos.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
  };

  const startEdit = (t: Todo) => {
    setEditingId(t.id || null);
    setEditingText(t.title);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await saveTodos(todos.map(t => t.id === editingId ? { ...t, title: editingText } : t));
    setEditingId(null);
    setEditingText('');
  };

  const prevDay = () => {
    const i = days.indexOf(currentDay);
    if (i < days.length - 1) setCurrentDay(days[i + 1]);
  };
  const nextDay = () => {
    const i = days.indexOf(currentDay);
    if (i > 0) setCurrentDay(days[i - 1]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={() => { if (!processing) onClose(); }} />

      <div
        className="relative w-full max-w-3xl mx-auto bg-surface/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 z-10
                   sm:mx-4 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevDay}
              disabled={days.indexOf(currentDay) === days.length - 1 || processing}
              className="p-2 rounded-md bg-background/50 hover:bg-background text-text-primary"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <div>
              <div className="text-xs text-text-secondary">My Day</div>
              <div className="font-semibold text-text-primary">{new Date(currentDay).toLocaleDateString()}</div>
            </div>

            <button
              onClick={nextDay}
              disabled={days.indexOf(currentDay) === 0 || processing}
              className="p-2 rounded-md bg-background/50 hover:bg-background text-text-primary"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <div className="w-48">
            <div className="text-xs text-text-secondary mb-1">Progress</div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${dayProgress}%` }}
                className="h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              />
            </div>
            <div className="text-xs text-text-secondary mt-1">{dayProgress}%</div>
          </div>
        </div>

        {/* add input */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded-md border border-border-color bg-transparent text-text-primary"
            placeholder="Add new task for selected day..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
            disabled={processing}
          />
          <button
            onClick={addTask}
            className="px-4 py-2 rounded-md bg-primary text-white font-medium disabled:opacity-60"
            disabled={processing}
          >
            Add
          </button>
        </div>

        {/* body */}
        <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Spinner /></div>
          ) : dayTasks.length === 0 ? (
            <div className="text-text-secondary py-6 text-center">No tasks for this day.</div>
          ) : (
            dayTasks.map(t => {
              const overdue = t.status !== 'done' && (t.date && t.date < isoDate());
              return (
                <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${overdue ? 'border border-red-400 bg-red-700/10' : 'bg-background/40'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleDone(t.id)} disabled={processing} />
                    <div>
                      {editingId === t.id ? (
                        <input className="p-1 border rounded text-text-primary" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                      ) : (
                        <div className={`${t.status === 'done' ? 'line-through text-text-secondary' : 'text-text-primary'} font-medium`}>{t.title}</div>
                      )}
                      <div className="text-xs text-text-secondary">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}
                        {overdue && <span className="ml-2 text-red-400">⚠ overdue</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === t.id ? (
                      <>
                        <button onClick={saveEdit} className="px-2 py-1 bg-emerald-500 text-white rounded text-sm" disabled={processing}>Save</button>
                        <button onClick={() => { setEditingId(null); setEditingText(''); }} className="px-2 py-1 border rounded text-sm" disabled={processing}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(t)} className="px-2 py-1 border rounded text-sm" disabled={processing}>Edit</button>
                        <button onClick={() => removeTask(t.id)} className="px-2 py-1 text-red-500 rounded text-sm" disabled={processing}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* footer */}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => { if (!processing) onClose(); }} className="px-4 py-2 border rounded-md">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TodoListDialog;
