import React, { useState, useEffect } from 'react';
import { getUserTodoList, updateUserTodoList } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface TodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !user) return;

    setLoading(true);
    (async () => {
      const data = await getUserTodoList(user.id);
      let todayTasks = data[todayStr] || [];
      todayTasks = todayTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        if (task.done && taskDate !== todayStr) return false;
        return true;
      });
      setTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user, todayStr]);

  // Auto-save with debounce
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      await updateUserTodoList(user.id, { [todayStr]: todos });
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [todos, user, todayStr]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = { id: Date.now().toString(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() };
    setTodos(prev => [...prev, task]);
    setNewTask('');
  };

  const handleToggleDone = (taskId: string) => {
    setTodos(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTodos(prev => prev.filter(t => t.id !== taskId));
  };

  if (!isOpen) return null;

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Today's Tasks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl transition">×</button>
        </div>

        {/* Progress bar */}
        {todos.length > 0 && (
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
            />
          </div>
        )}

        {/* Todo list */}
        <ul className="space-y-3 mb-4">
          {todos.map(task => (
            <li
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 w-full">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task.id)}
                  className="w-6 h-6 text-primary accent-primary transition"
                />
                <span className={`${task.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'} flex-1`}>
                  {task.text}
                </span>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-gray-400 hover:text-red-500 transition text-xl"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-secondary transition"
          >
            Add
          </button>
        </div>

        <style>{`
          @keyframes fade-in { 0% { opacity: 0; transform: translateY(-5px);} 100% { opacity:1; transform: translateY(0);} }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
