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
import { VideoIcon, SearchIcon, FilterIcon } from '../components/Icons';

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

const groupTodosByDate = (todos: Todo[]) => {
  // returns record date -> Todo[]
  const map: Record<string, Todo[]> = {};
  todos.forEach(t => {
    const key = t.date ? t.date.slice(0, 10) : isoDate();
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  return map;
};

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
  const [currentDay, setCurrentDay] = useState<string>(isoDate()); // YYYY-MM-DD
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

  // load todos for current user when modal opens
  useEffect(() => {
    if (!isTodoOpen) return;
    const load = async () => {
      if (!user?.id) return;
      setLoadingTodos(true);
      try {
        const data = await getUserTodos(String(user.id));
        // normalize fields in case sheet stored strings
        const normalized: Todo[] = (data || []).map((t: any) => ({
          id: t.id ? String(t.id) : (Date.now().toString() + Math.random().toString(36).slice(2)),
          title: String(t.title || t.task || ''),
          date: t.date ? String(t.date).slice(0, 10) : isoDate(),
          status: t.status === 'done' ? 'done' : 'pending',
          rating: t.rating ? Number(t.rating) : 0,
          notes: t.notes || '',
          createdAt: t.createdAt || new Date().toISOString()
        }));
        setTodos(normalized);
        // set currentDay to today if none
        setCurrentDay(prev => prev || isoDate());
      } catch (e) {
        console.error('Failed to load todos', e);
      } finally {
        setLoadingTodos(false);
      }
    };
    load();
  }, [isTodoOpen, user]);

  const filteredResources = useMemo(() => {
    const searchWords = searchTerm.toLowerCase().split(' ').filter(w => w.length > 0);
    return resources
      .filter(r => {
        if (searchWords.length === 0) return true;
        const title = r.title.toLowerCase();
        const subject = r.Subject_Name.toLowerCase();
        return searchWords.every(word => title.includes(word) || subject.includes(word));
      })
      .filter(r => (selectedSubject ? r.Subject_Name === selectedSubject : true));
  }, [resources, searchTerm, selectedSubject]);

  const watchedData = useMemo(() => parseWatchedData(user?.watched), [user]);

  const continueWatchingResources = useMemo(() => {
    const watchedEntries = Object.entries(watchedData);
    if (watchedEntries.length === 0) return [];
    const resourceMap = new Map(resources.map(r => [r.id, r]));
    return watchedEntries
      .map(([id, progress]) => {
        const resource = resourceMap.get(id);
        if (!resource) return null;
        const percentage = progress.duration > 0 ? (progress.time / progress.duration) * 100 : 0;
        return { resource, progress: percentage };
      })
      .filter((item): item is { resource: Resource; progress: number } => item !== null)
      .sort((a, b) => (watchedData[b.resource.id]?.time || 0) - (watchedData[a.resource.id]?.time || 0));
  }, [resources, watchedData]);

  const groupedResources = useMemo(() => {
    return filteredResources.reduce((acc, resource) => {
      const subject = resource.Subject_Name || 'Uncategorized';
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(resource);
      return acc;
    }, {} as Record<string, Resource[]>);
  }, [filteredResources]);

  const orderedSubjects = useMemo(() => {
    const visibleSubjects = new Set(filteredResources.map(r => r.Subject_Name));
    return subjects.filter(s => visibleSubjects.has(s.Subject_Name));
  }, [filteredResources, subjects]);

  const handleDeleteRequest = (id: string) => setDialogState({ isOpen: true, resourceId: id });

  const handleConfirmDelete = async () => {
    if (!dialogState.resourceId) return;
    try {
      await deleteResource(dialogState.resourceId);
      setResources(prev => prev.filter(r => r.id !== dialogState.resourceId));
    } catch (err) {
      alert('Failed to delete resource. Please try again.');
      console.error(err);
    } finally {
      setDialogState({ isOpen: false, resourceId: null });
    }
  };

  const targetedResource = resources.find(r => r.id === dialogState.resourceId);

  // --- Todo handlers ---
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
      date: date,
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
    await saveTodosToSheet(todos.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
  };

  const startEdit = (t: Todo) => {
    setEditingId(t.id || null);
    setEditingTitle(t.title);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await saveTodosToSheet(todos.map(t => t.id === editingId ? { ...t, title: editingTitle } : t));
    setEditingId(null);
    setEditingTitle('');
  };

  const changeDay = (dir: number) => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() + dir);
    setCurrentDay(isoDate(d));
  };

  const dayTasks = useMemo(() => todos.filter(t => (t.date ? t.date.slice(0, 10) : isoDate()) === currentDay), [todos, currentDay]);

  const dayProgressPercent = useMemo(() => {
    if (dayTasks.length === 0) return 0;
    const done = dayTasks.filter(t => t.status === 'done').length;
    return Math.round((done / dayTasks.length) * 100);
  }, [dayTasks]);

  if (loading) return <div className="pt-24"><Spinner /></div>;
  if (error) return <div className="pt-24 text-center text-red-500 text-xl">{error}</div>;

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-slate-800 pt-36 pb-24 text-center border-b border-border-color">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 animate-fade-in-up">
            Welcome back, <span className="text-primary">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {heroMessage}
          </p>
          <div className="max-w-2xl mx-auto bg-surface p-2 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 animate-fade-in-up border border-border-color" style={{ animationDelay: '0.2s' }}>
            <SearchIcon className="ml-4 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-base sm:text-lg text-text-primary placeholder-text-secondary"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-primary hover:bg-cyan-400 transition-colors shadow-md"
              >
                <FilterIcon className="h-5 w-5" />
                <span className="hidden md:inline">Filter</span>
                {selectedSubject && <span className="hidden md:inline bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedSubject}</span>}
              </button>

              <button
                onClick={() => setTodoOpen(true)}
                className="ml-2 inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-md"
              >
                My Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Todo modal trigger area removed from body — modal below */}

      {/* Content Sections Wrapper */}
      <div className="container mx-auto px-4">
        {continueWatchingResources.length > 0 && (
          <section className="-mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Continue Watching</h2>
            <div className="relative">
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin overscroll-x-contain">
                {continueWatchingResources.map(({ resource, progress }, index) => (
                  <div key={resource.id} className="flex-shrink-0 w-72 sm:w-80">
                    <ResourceCard
                      resource={resource}
                      onDelete={handleDeleteRequest}
                      userRole={user?.role}
                      animationDelay={`${index * 50}ms`}
                      watchProgress={progress}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-background pointer-events-none md:hidden"></div>
            </div>
          </section>
        )}

        <div className={`space-y-10 ${continueWatchingResources.length > 0 ? 'mt-16' : '-mt-8'}`}>
          {filteredResources.length === 0 && searchTerm.length > 0 ? (
            <p className="text-center text-text-secondary text-lg pt-10">
              No courses found matching your criteria.
            </p>
          ) : (
            orderedSubjects.map((subject) => (
              <section key={subject.id}>
                <h2 className="text-2xl font-bold text-text-primary mb-4">{subject.Subject_Name}</h2>
                <div className="relative">
                  <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin overscroll-x-contain">
                    {groupedResources[subject.Subject_Name].map((resource, index) => (
                      <div key={resource.id} className="flex-shrink-0 w-72 sm:w-80">
                        <ResourceCard
                          resource={resource}
                          onDelete={handleDeleteRequest}
                          userRole={user?.role}
                          animationDelay={`${index * 50}ms`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-background pointer-events-none md:hidden"></div>
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, resourceId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
        message={
          <>
            Are you sure you want to delete this resource?
            <br />
            <strong>{targetedResource?.title}</strong>
            <br />
            This action cannot be undone.
          </>
        }
        confirmButtonText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />

      <SubjectFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSelectSubject={setSelectedSubject}
      />

      {/* ---------------- Todo Modal ---------------- */}
      {isTodoOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setTodoOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-surface rounded-2xl shadow-xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => changeDay(-1)} className="px-3 py-2 rounded bg-background">◀</button>
                <div>
                  <div className="text-sm text-text-secondary">My Day</div>
                  <div className="font-semibold">{new Date(currentDay).toLocaleDateString()}</div>
                </div>
                <button onClick={() => changeDay(1)} className="px-3 py-2 rounded bg-background">▶</button>
              </div>

              <div className="text-right">
                <div className="text-xs text-text-secondary">Progress</div>
                <div className="w-40 bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div style={{ width: `${dayProgressPercent}%` }} className="h-2 bg-emerald-500"></div>
                </div>
                <div className="text-sm mt-1">{dayProgressPercent}%</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add new task for selected day..."
                  className="flex-1 p-2 rounded border border-border-color bg-white/5"
                />
                <button onClick={() => addTask(newTaskTitle, currentDay)} className="px-4 py-2 bg-primary text-white rounded">Add</button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3">
              {loadingTodos ? (
                <div>Loading tasks...</div>
              ) : (
                <>
                  {dayTasks.length === 0 ? (
                    <div className="text-text-secondary">No tasks for this day.</div>
                  ) : (
                    dayTasks.map(t => {
                      const overdue = t.status !== 'done' && (t.date && t.date < isoDate());
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTaskDone(t.id!)} />
                            <div>
                              {editingId === t.id ? (
                                <input className="p-1 border rounded" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                              ) : (
                                <div className={`${t.status === 'done' ? 'line-through text-text-secondary' : ''} font-medium`}>{t.title}</div>
                              )}
                              <div className="text-xs text-text-secondary">{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''} {overdue && <span className="text-red-400 ml-2">Overdue</span>}</div>
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
                                <button onClick={() => startEdit(t)} className="px-2 py-1 border rounded text-sm">Edit</button>
                                <button onClick={() => removeTask(t.id!)} className="px-2 py-1 text-red-600 rounded text-sm">Delete</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setTodoOpen(false)} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* -------------- end Todo Modal -------------- */}
    </div>
  );
};

export default HomePage;
