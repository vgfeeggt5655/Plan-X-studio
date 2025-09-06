// src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources, deleteResource } from '../services/googleSheetService';
import { getSubjects } from '../services/subjectService';
import { Resource, Subject, Todo } from '../types';
import ResourceCard from '../components/ResourceCard';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import SubjectFilterDialog from '../components/SubjectFilterDialog';
import { useAuth } from '../contexts/AuthContext';
import { getUserTodos, updateUserTodos } from '../services/authService';
import { SearchIcon, FilterIcon } from '../components/Icons';

const encouragingMessages = [
  "Your next discovery is just a search away. What will you learn today?",
  "Unlock new knowledge. Find the perfect lecture to spark your curiosity.",
  "The journey of a thousand miles begins with a single click. Start learning now.",
  "Expand your horizons. Search for a topic and let the learning begin.",
  "Knowledge is power. Find your next lecture and empower yourself."
];

type WatchedProgress = { time: number; duration: number };

const parseWatchedData = (watched: string | undefined | null): Record<string, WatchedProgress> => {
  if (!watched || typeof watched !== 'string' || watched.trim() === '') return {};
  try {
    const data = JSON.parse(watched);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
    const normalizedData: Record<string, WatchedProgress> = {};
    for (const key in data) {
      if (typeof data[key] === 'number') {
        normalizedData[key] = { time: data[key], duration: 0 };
      } else if (typeof data[key] === 'object' && 'time' in data[key] && 'duration' in data[key]) {
        normalizedData[key] = data[key];
      }
    }
    return normalizedData;
  } catch (e) {
    console.error("Failed to parse watched data", e);
    return {};
  }
};

const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

const HomePage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; resourceId: string | null }>({ isOpen: false, resourceId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [heroMessage, setHeroMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Todo modal state
  const [isTodoOpen, setTodoOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [currentDay, setCurrentDay] = useState<string>(isoDate());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resourcesData, subjectsData] = await Promise.all([getResources(), getSubjects()]);
      setResources(resourcesData.reverse());
      const sortedSubjects = subjectsData.sort((a, b) => a.number - b.number);
      setSubjects(sortedSubjects);
    } catch (err) {
      setError('Failed to load content. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setHeroMessage(encouragingMessages[randomIndex]);
  }, [fetchInitialData]);

  // load todos
  useEffect(() => {
    if (!isTodoOpen) return;
    const load = async () => {
      if (!user?.id) return;
      setLoadingTodos(true);
      try {
        const data = await getUserTodos(String(user.id));
        const normalized: Todo[] = (data || []).map((t: any) => ({
          id: t.id ? String(t.id) : (Date.now().toString() + Math.random().toString(36).slice(2)),
          title: String(t.title || t.task || ''),
          date: t.date ? String(t.date).slice(0, 10) : isoDate(),
          status: t.status === 'done' ? 'done' : 'pending',
          rating: t.rating ? Number(t.rating) : 0,
          notes: t.notes || '',
          createdAt: t.createdAt || new Date().toISOString()
        }));

        // ⏳ Smart logic: carry overdue tasks into today, drop old completed ones
        const today = isoDate();
        const processed = normalized.filter(t => {
          if (t.status === 'done') {
            return t.date === today; // keep today's done, drop old ones
          }
          if (t.date < today) {
            // overdue → move to today
            t.date = today;
            return true;
          }
          return true;
        });

        setTodos(processed);
        setCurrentDay(today);
      } catch (e) {
        console.error('Failed to load todos', e);
      } finally {
        setLoadingTodos(false);
      }
    };
    load();
  }, [isTodoOpen, user]);

  const saveTodosToSheet = async (nextTodos: Todo[]) => {
    if (!user?.id) {
      setTodos(nextTodos);
      return;
    }
    setTodos(nextTodos);
    try {
      await updateUserTodos(String(user.id), nextTodos);
    } catch (e) {
      console.error('Failed to save todos', e);
    }
  };

  const addTask = async (title: string, date = currentDay) => {
    if (!title.trim()) return;
    const newItem: Todo = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title: title.trim(),
      date,
      status: 'pending',
      rating: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };
    await saveTodosToSheet([newItem, ...todos]);
    setNewTaskTitle('');
  };

  const removeTask = async (id: string) => {
    await saveTodosToSheet(todos.filter(t => t.id !== id));
  };

  const toggleTaskDone = async (id: string) => {
    await saveTodosToSheet(
      todos.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t)
    );
  };

  const startEdit = (t: Todo) => {
    setEditingId(t.id || null);
    setEditingTitle(t.title);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await saveTodosToSheet(
      todos.map(t => t.id === editingId ? { ...t, title: editingTitle } : t)
    );
    setEditingId(null);
    setEditingTitle('');
  };

  const changeDay = (dir: number) => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() + dir);
    setCurrentDay(isoDate(d));
  };

  const dayTasks = useMemo(() => todos.filter(t => t.date === currentDay), [todos, currentDay]);

  const dayProgressPercent = useMemo(() => {
    if (dayTasks.length === 0) return 0;
    const done = dayTasks.filter(t => t.status === 'done').length;
    return Math.round((done / dayTasks.length) * 100);
  }, [dayTasks]);

  if (loading) return <div className="pt-24"><Spinner /></div>;
  if (error) return <div className="pt-24 text-center text-red-500 text-xl">{error}</div>;

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-background to-slate-800 pt-36 pb-24 text-center border-b border-border-color">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4">
            Welcome back, <span className="text-primary">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            {heroMessage}
          </p>
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
            <SearchIcon className="ml-4 h-5 w-5 text-gray-300" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-base text-white placeholder-gray-300"
            />
            <button
              onClick={() => setFilterOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-full text-white bg-primary hover:bg-cyan-400"
            >
              <FilterIcon className="h-5 w-5 inline" /> Filter
            </button>
            <button
              onClick={() => setTodoOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-full text-white bg-emerald-500 hover:bg-emerald-400"
            >
              My Tasks
            </button>
          </div>
        </div>
      </div>

      {/* -------- Todo Modal -------- */}
      {isTodoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setTodoOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 z-10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => changeDay(-1)} className="px-3 py-2 rounded bg-white/10">◀</button>
                <div>
                  <div className="text-sm text-gray-200">My Day</div>
                  <div className="font-semibold text-white">{new Date(currentDay).toLocaleDateString()}</div>
                </div>
                <button onClick={() => changeDay(1)} className="px-3 py-2 rounded bg-white/10">▶</button>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-300">Progress</div>
                <div className="w-40 bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
                  <div style={{ width: `${dayProgressPercent}%` }} className="h-2 bg-emerald-400"></div>
                </div>
                <div className="text-sm text-gray-200 mt-1">{dayProgressPercent}%</div>
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-6">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add new task..."
                className="flex-1 p-2 rounded-lg border border-gray-500 bg-white/20 text-white placeholder-gray-300"
              />
              <button
                onClick={() => addTask(newTaskTitle, currentDay)}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Add
              </button>
            </div>

            {/* Tasks */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
              {loadingTodos ? (
                <div className="text-gray-200">Loading tasks...</div>
              ) : dayTasks.length === 0 ? (
                <div className="text-gray-400">No tasks for this day.</div>
              ) : (
                dayTasks.map(t => {
                  const overdue = t.status !== 'done' && t.date < isoDate();
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl shadow-md ${
                        overdue ? 'bg-red-500/20 border border-red-400' : 'bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={t.status === 'done'}
                          onChange={() => toggleTaskDone(t.id!)}
                        />
                        <div>
                          {editingId === t.id ? (
                            <input
                              className="p-1 border rounded"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                            />
                          ) : (
                            <div className={`${t.status === 'done' ? 'line-through text-gray-400' : 'text-white'} font-medium`}>
                              {t.title}
                            </div>
                          )}
                          <div className="text-xs text-gray-300">
                            {new Date(t.createdAt).toLocaleString()}
                            {overdue && <span className="text-red-400 ml-2">⚠ Overdue</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === t.id ? (
                          <>
                            <button onClick={saveEdit} className="px-2 py-1 bg-emerald-500 text-white rounded text-sm">Save</button>
                            <button onClick={() => { setEditingId(null); setEditingTitle(''); }} className="px-2 py-1 border rounded text-sm">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(t)} className="px-2 py-1 border rounded text-sm text-white">Edit</button>
                            <button onClick={() => removeTask(t.id!)} className="px-2 py-1 text-red-400 rounded text-sm">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setTodoOpen(false)} className="px-4 py-2 border rounded text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
