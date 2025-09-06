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
import { getUsers, updateUserTodo } from '../services/authService';

const encouragingMessages = [
  "Your next discovery is just a search away. What will you learn today?",
  "Unlock new knowledge. Find the perfect lecture to spark your curiosity.",
  "The journey of a thousand miles begins with a single click. Start learning now.",
  "Expand your horizons. Search for a topic and let the learning begin.",
  "Knowledge is power. Find your next lecture and empower yourself."
];

type TodoTask = {
  id: string;
  title: string;
  done: boolean;
  date: string; // YYYY-MM-DD
};

const parseDate = (str: string) => new Date(str + 'T00:00:00');

const todayStr = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

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
  const [isTodoOpen, setTodoOpen] = useState(false);
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Fetch resources and subjects
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

  // Fetch todo tasks from user
  const fetchTodoTasks = async () => {
    if (!user) return;
    try {
      const tasks: TodoTask[] = JSON.parse(user.todo_list || '[]');

      // حذف المهام اللي اتعملت امبارح
      const yesterday = yesterdayStr();
      const updatedTasks = tasks.filter(t => !(t.date === yesterday && t.done));

      // تحديث المستخدم على Google Sheet بعد الحذف
      await updateUserTodo(user.id, updatedTasks);

      setTodoTasks(updatedTasks);
      setUser({ ...user, todo_list: JSON.stringify(updatedTasks) });
    } catch (err) {
      console.error('Failed to parse todo_list', err);
      setTodoTasks([]);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setHeroMessage(encouragingMessages[randomIndex]);
  }, [fetchInitialData]);

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

  const handleToggleTask = async (taskId: string) => {
    const updated = todoTasks.map(t => t.id === taskId ? {...t, done: !t.done} : t);
    setTodoTasks(updated);
    if (user) await updateUserTodo(user.id, updated);
    if (user) setUser({...user, todo_list: JSON.stringify(updated)});
  };

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
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {heroMessage}
          </p>

          {/* Search + Filter + Todo Button */}
          <div className="max-w-2xl mx-auto bg-surface p-2 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 animate-fade-in-up border border-border-color" style={{animationDelay: '0.2s'}}>
            <SearchIcon className="ml-4 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-base sm:text-lg text-text-primary placeholder-text-secondary"
            />
            <button
              onClick={() => setFilterOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-primary hover:bg-cyan-400 transition-colors shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40"
            >
              <FilterIcon className="h-5 w-5" />
              <span className="hidden md:inline">Filter</span>
              {selectedSubject && <span className="hidden md:inline bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedSubject}</span>}
            </button>
            <button
              onClick={() => { setTodoOpen(true); fetchTodoTasks(); }}
              className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-500 transition-colors shadow-md shadow-green-400/20 hover:shadow-lg hover:shadow-green-400/40"
            >
              📝 My Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections Wrapper */}
      <div className="container mx-auto px-4">
        {/* Continue Watching, Sections etc. (keep your original code here) */}
      </div>

      {/* Todo List Modal */}
      <ConfirmDialog
        isOpen={isTodoOpen}
        onClose={() => setTodoOpen(false)}
        title="My Tasks"
      >
        {todoTasks.length === 0 ? (
          <p className="text-center text-text-secondary">No tasks for today! 🎉</p>
        ) : (
          <ul className="space-y-2">
            {todoTasks.map(task => {
              const isYesterday = task.date === yesterdayStr();
              return (
                <li key={task.id} className={`p-3 rounded-md flex justify-between items-center ${task.done ? 'bg-green-100' : isYesterday ? 'bg-red-100' : 'bg-surface'} transition-all animate-fade-in-scale`}>
                  <span className={`${task.done ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`px-2 py-1 rounded-md text-white ${task.done ? 'bg-gray-400 hover:bg-gray-500' : 'bg-primary hover:bg-cyan-400'}`}
                  >
                    {task.done ? 'Done' : isYesterday ? 'Missed' : 'Mark Done'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, resourceId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
      >
        <p>Are you sure you want to delete this resource?</p>
      </ConfirmDialog>

      <SubjectFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSelectSubject={setSelectedSubject}
      />
    </div>
  );
};

export default HomePage;
