// HomePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources, deleteResource } from '../services/googleSheetService';
import { getSubjects } from '../services/subjectService';
import { Resource, Subject } from '../types';
import ResourceCard from '../components/ResourceCard';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import SubjectFilterDialog from '../components/SubjectFilterDialog';
import { useAuth } from '../contexts/AuthContext';
import { VideoIcon, SearchIcon, FilterIcon } from '../components/Icons';
import { updateUserTodo } from '../services/authService';

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

interface TodoItem {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  done: boolean;
}

const HomePage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{isOpen: boolean; resourceId: string | null}>({ isOpen: false, resourceId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [heroMessage, setHeroMessage] = useState('');
  const [todoOpen, setTodoOpen] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resourcesData, subjectsData] = await Promise.all([
        getResources(),
        getSubjects()
      ]);
      setResources(resourcesData.reverse());
      const sortedSubjects = subjectsData.sort((a,b) => a.number - b.number);
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

  const filteredResources = useMemo(() => {
    const searchWords = searchTerm.toLowerCase().split(' ').filter(w => w.length > 0);
    return resources
      .filter(r => {
        if (searchWords.length === 0) return true;
        const title = r.title.toLowerCase();
        const subject = r.Subject_Name.toLowerCase();
        return searchWords.every(word => title.includes(word) || subject.includes(word));
      })
      .filter(r => selectedSubject ? r.Subject_Name === selectedSubject : true);
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

  const handleDeleteRequest = (id: string) => {
    setDialogState({ isOpen: true, resourceId: id });
  };

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

  // Todo List Logic
  const [todos, setTodos] = useState<TodoItem[]>([]);
  useEffect(() => {
    if (!user) return;
    let parsed: TodoItem[] = [];
    try { parsed = JSON.parse(user.todo_list || '[]'); } catch(e){ parsed = []; }
    const today = new Date().toISOString().split('T')[0];
    parsed = parsed.filter(todo => !(todo.done && todo.date < today)); // حذف المهام المنجزة القديمة
    setTodos(parsed);
  }, [user]);

  const toggleTodo = async (id: string) => {
    const updated = todos.map(todo => todo.id === id ? {...todo, done: !todo.done} : todo);
    setTodos(updated);
    if (user) {
      await updateUserTodo(user.id, updated);
      setUser({...user, todo_list: JSON.stringify(updated)});
    }
  };

  if (loading) return <div className="pt-24"><Spinner /></div>;
  if (error) return <div className="pt-24 text-center text-red-500 text-xl">{error}</div>;

  return (
    <div className="space-y-12 pb-12 relative">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-slate-800 pt-36 pb-24 text-center border-b border-border-color">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 animate-fade-in-up">
             Welcome back, <span className="text-primary">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {heroMessage}
          </p>
          <button
            className="bg-primary text-white px-5 py-2 rounded-full shadow-lg hover:bg-cyan-400 transition"
            onClick={()=>setTodoOpen(true)}
          >
            My Tasks
          </button>
        </div>
      </div>

      {/* Todo List Overlay */}
      {todoOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setTodoOpen(false)}>
          <div className="bg-surface p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h2 className="text-xl font-bold text-text-primary mb-4">Today's Tasks</h2>
            {todos.length === 0 ? (
              <p className="text-text-secondary">No tasks for today! 🎉</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {todos.map(todo=>(
                  <li key={todo.id} className={`flex items-center justify-between p-2 rounded-md ${todo.done ? 'bg-green-100' : 'bg-red-100 text-red-700'}`}>
                    <span>{todo.title}</span>
                    <input type="checkbox" checked={todo.done} onChange={()=>toggleTodo(todo.id)} />
                  </li>
                ))}
              </ul>
            )}
            <button
              className="mt-4 bg-primary text-white px-4 py-2 rounded-full w-full hover:bg-cyan-400 transition"
              onClick={()=>setTodoOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="container mx-auto px-4">
        {continueWatchingResources.length>0 && (
          <section className="-mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Continue Watching</h2>
            <div className="relative flex overflow-x-auto gap-6 pb-4 scrollbar-thin overscroll-x-contain">
              {continueWatchingResources.map(({resource,progress},index)=>(
                <div key={resource.id} className="flex-shrink-0 w-72 sm:w-80">
                  <ResourceCard
                    resource={resource}
                    onDelete={handleDeleteRequest}
                    userRole={user?.role}
                    animationDelay={`${index*50}ms`}
                    watchProgress={progress}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={`space-y-10 ${continueWatchingResources.length>0?'mt-16':'-mt-8'}`}>
          {filteredResources.length===0 && searchTerm.length>0 ? (
            <p className="text-center text-text-secondary text-lg pt-10">
              No courses found matching your criteria.
            </p>
          ) : (
            orderedSubjects.map(subject=>(
              <section key={subject.id}>
                <h2 className="text-2xl font-bold text-text-primary mb-4">{subject.Subject_Name}</h2>
                <div className="relative flex overflow-x-auto gap-6 pb-4 scrollbar-thin overscroll-x-contain">
                  {groupedResources[subject.Subject_Name].map((resource,index)=>(
                    <div key={resource.id} className="flex-shrink-0 w-72 sm:w-80">
                      <ResourceCard
                        resource={resource}
                        onDelete={handleDeleteRequest}
                        userRole={user?.role}
                        animationDelay={`${index*50}ms`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={()=>setDialogState({isOpen:false,resourceId:null})}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
        message={<><strong>{targetedResource?.title}</strong> will be permanently deleted.</>}
        confirmButtonText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />

      <SubjectFilterDialog
        isOpen={isFilterOpen}
        onClose={()=>setFilterOpen(false)}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSelectSubject={setSelectedSubject}
      />
    </div>
  );
};

export default HomePage;
