import React, { useEffect, useMemo, useState } from 'react';
import { Task, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { updateUser } from '../services/authService';
import { XIcon, PlusIcon } from './Icons'; // استخدم الأيقونات عندك أو غيّر الاستيراد
import dayjs from 'dayjs';

const todayISO = () => dayjs().format('YYYY-MM-DD');
const yesterdayISO = () => dayjs().subtract(1, 'day').format('YYYY-MM-DD');

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth() as { user: User | null; setUser?: (u: User|null) => void };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // load tasks from user.todo_list
  useEffect(() => {
    if (!isOpen) return;
    if (!user) {
      setTasks([]);
      return;
    }
    try {
      const raw = user.todo_list || '[]';
      const parsed: Task[] = JSON.parse(raw);
      setTasks(parsed);
    } catch (e) {
      console.error('Failed parse todo_list', e);
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  // When dialog opens, process old tasks:
  // - completed tasks with date < today -> remove (archive/delete)
  // - incomplete tasks with date < today -> move to today and mark overdue
  useEffect(() => {
    if (!isOpen) return;
    const process = () => {
      const today = todayISO();
      const updated: Task[] = [];
      let changed = false;
      const currentRaw = user?.todo_list || '[]';
      let parsed: Task[] = [];
      try { parsed = JSON.parse(currentRaw); } catch { parsed = []; }

      parsed.forEach(t => {
        if (t.date < today) {
          if (t.completed) {
            // drop (archive)
            changed = true;
            return;
          } else {
            // move to today (keep id), mark date -> today
            updated.push({ ...t, date: today });
            changed = true;
            return;
          }
        }
        updated.push(t);
      });

      // ensure we have unique ids and presence
      const normalized = updated.map(t => ({ ...t, id: t.id || genId() }));
      setTasks(normalized);

      if (changed && user) {
        // persist
        persistTasks(normalized);
      }
    };

    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const persistTasks = async (nextTasks: Task[]) => {
    if (!user) return;
    try {
      setLoadingSave(true);
      const copy: User = { ...user, todo_list: JSON.stringify(nextTasks) };
      await updateUser(copy);
      // try to update context if setter exists
      if (setUser) {
        setUser(copy);
      } else {
        // fallback: no setter -> keep local state only
        console.warn('AuthContext has no setUser; persisted to sheet but context not updated.');
      }
    } catch (e) {
      console.error('Failed to save tasks', e);
      alert('خطأ في حفظ المهام. حاول مرة أخرى.');
    } finally {
      setLoadingSave(false);
    }
  };

  const todayTasks = useMemo(() => {
    const t = todayISO();
    return tasks.filter(task => task.date === t);
  }, [tasks]);

  const overdueFlag = (task: Task) => {
    // overdue if original date < today. But we moved old incomplete to today.
    // We'll compute: if task has an extra marker? Simpler: if it was moved we left it date = today.
    // We'll mark as overdue if it has a custom flag stored in title prefix like '[OVERDUE]' - but we didn't.
    // Simpler heuristic: if task has a property 'migrated' skip. We'll mark overdue if its id was present in previous day's list.
    // For reliability we mark as overdue if task has property 'migrated' present.
    return (task as any).overdue === true;
  };

  // When we moved yesterday incomplete to today, we didn't set overdue flag. Let's mark them now:
  useEffect(() => {
    // Mark as overdue if originally their date < today in storage history.
    // We can detect by comparing created timestamp in id if any. This is heuristic.
    // Simpler: if task.date === today and originally not created today then mark overdue.
    const today = todayISO();
    const prevRaw = user?.todo_list || '[]';
    let parsedPrev: Task[] = [];
    try { parsedPrev = JSON.parse(prevRaw); } catch { parsedPrev = []; }
    const prevIds = new Set(parsedPrev.map(p => p.id));
    // but parsedPrev is before modifications; processed earlier.
    // Instead we mark overdue tasks as those whose original date was < today before we processed.
    // Because we already moved such tasks on open and persisted, we can detect those by comparing id creation time.
    const updated = tasks.map(t => {
      if (t.date !== today) return t;
      // if id timestamp older than today (heuristic)
      const idTime = Number(String(t.id).split('-')[0] || 0);
      if (idTime && idTime < Number(dayjs().startOf('day').valueOf())) {
        return { ...t, ...( { } as any ), overdue: true } as Task & { overdue?: boolean };
      }
      return t;
    });
    setTasks(updated as Task[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]); // run after tasks load

  const toggleComplete = async (taskId: string) => {
    const next = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(next);
    await persistTasks(next);
  };

  const removeTask = async (taskId: string) => {
    const next = tasks.filter(t => t.id !== taskId);
    setTasks(next);
    await persistTasks(next);
  };

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const t: Task = { id: genId(), title, date: todayISO(), completed: false };
    const next = [t, ...tasks];
    setTasks(next);
    setNewTitle('');
    await persistTasks(next);
  };

  const progress = useMemo(() => {
    const today = todayTasks;
    if (today.length === 0) return 0;
    const done = today.filter(t => t.completed).length;
    return Math.round((done / today.length) * 100);
  }, [todayTasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!loadingSave) onClose(); }} />
      <div className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <div>
            <h3 className="text-lg font-semibold">Tasks — Today</h3>
            <p className="text-sm text-text-secondary">Only today's tasks are shown. Late incomplete tasks moved here.</p>
          </div>
          <button onClick={() => { if (!loadingSave) onClose(); }} className="p-2 rounded-md hover:bg-gray-100">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Progress</div>
              <div className="text-sm font-semibold">{progress}%</div>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-2 rounded-full bg-primary transition-all" />
            </div>
          </div>

          {/* New task input */}
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
              placeholder="Add a new task for today..."
              className="flex-1 px-3 py-2 rounded-lg border border-border-color bg-transparent focus:outline-none"
            />
            <button onClick={addTask} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white">
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Tasks list */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {todayTasks.length === 0 && (
              <div className="text-center text-text-secondary py-6">No tasks for today. Add one above.</div>
            )}

            {todayTasks.map(task => {
              const isOverdue = (task as any).overdue === true;
              return (
                <div key={task.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isOverdue ? 'border-red-400 bg-red-50' : 'border-border-color bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="h-5 w-5"
                    />
                    <div>
                      <div className={`text-sm ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.title}</div>
                      {isOverdue && !task.completed && <div className="text-xs text-red-600">Overdue from previous day</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-text-secondary">{task.date}</div>
                    <button onClick={() => removeTask(task.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-3 border-t border-border-color">
          <button
            onClick={() => { onClose(); }}
            className="px-4 py-2 rounded-lg border border-border-color"
            disabled={loadingSave}
          >
            Close
          </button>
          <button
            onClick={async () => { await persistTasks(tasks); alert('Saved'); }}
            className="px-4 py-2 rounded-lg bg-primary text-white"
            disabled={loadingSave}
          >
            {loadingSave ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
