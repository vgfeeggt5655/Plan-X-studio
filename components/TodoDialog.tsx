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

const encouragements = [
  "Keep going, you got this! 💪",
  "One step at a time, superstar! 🌟",
  "Crush your tasks today! 🚀",
  "Don't stop, the finish line is near! 🏁",
  "Stay awesome and productive! 😎",
  "Every task counts, let's do it! ✅",
  "Make today amazing! 🌈"
];

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [animatedIds, setAnimatedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const encouragement = encouragements[today.getDate() % encouragements.length];

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      const data = await getUserTodoList(user.id);
      const todayTasks = (data[todayStr] || []).filter(task => {
        const taskDateStr = new Date(task.createdAt).toISOString().split('T')[0];
        return !(task.done && taskDateStr !== todayStr);
      });
      setTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user, todayStr]);

  const saveTodos = async (updatedTodos: TodoItem[], animateId?: string) => {
    if (!user) return;
    setTodos(updatedTodos);
    setSaving(true);

    if (animateId) {
      setAnimatedIds(prev => [...prev, animateId]);
      setTimeout(() => setAnimatedIds(prev => prev.filter(id => id !== animateId)), 400);
    }

    await updateUserTodoList(user.id, { [todayStr]: updatedTodos });
    setSaving(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    saveTodos([...todos, task], task.id);
    setNewTask('');
  };

  const handleToggleDone = (taskId: string) => {
    const updated = todos.map(t => (t.id === taskId ? { ...t, done: !t.done } : t));
    saveTodos(updated, taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = todos.filter(t => t.id !== taskId);
    saveTodos(updated, taskId);
  };

  if (!isOpen) return null;

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const showProgress = doneCount > 0;
  const canClose = !saving;

  const isTaskOverdue = (task: TodoItem) => {
    const taskDate = new Date(task.createdAt);
    const diff = today.getTime() - taskDate.getTime();
    return !task.done && diff > 24 * 60 * 60 * 1000; // أكثر من يوم
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="relative w-full max-w-2xl p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 transition-transform scale-100 animate-fade-in-up">

        {/* عبارة تشجيعية */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary mb-4">{encouragement}</h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Today's Tasks</h3>
          { !canClose && (
            <p className="text-sm text-gray-600 dark:text-gray-300 ml-4">Saving tasks… please wait!</p>
          )}
          <button
            onClick={() => canClose && onClose()}
            disabled={!canClose}
            className={`text-red-500 font-bold text-3xl transition ${!canClose ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
          >
            ×
          </button>
        </div>

        {/* Loading Bar */}
        {loading && (
          <div className="relative w-full h-3 rounded-full overflow-hidden mb-4">
            <div className="absolute w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="absolute h-full w-1/3 bg-gradient-to-r from-primary to-cyan-400 rounded-full animate-loading"></div>
          </div>
        )}

        {/* قائمة المهام */}
        <ul className="space-y-3 mb-4">
          {todos.map(task => (
            <li
              key={task.id}
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300 transform
              ${animatedIds.includes(task.id) ? 'scale-105 opacity-80' : hoveredId === task.id ? 'scale-105' : 'scale-100'}
              `}
            >
              <div className="flex items-center gap-4 w-full">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task.id)}
                  className="w-8 h-8 transform transition-all duration-300"
                />
                <span className={`flex-1 text-lg ${task.done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                  {task.text}
                </span>
                {isTaskOverdue(task) && (
                  <span className="ml-2 text-red-600 font-bold text-sm animate-pulse">⚠ Overdue!</span>
                )}
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 font-bold text-xl hover:text-red-600 transition"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full h-3 rounded-full mb-4 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, #4ade80, #06b6d4)`,
              }}
            />
          </div>
        )}

        {/* إضافة مهمة حديثة */}
        <div className="flex gap-3 flex-col sm:flex-row mt-4">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-4 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary w-full text-lg font-medium shadow-md transition-transform hover:scale-105"
          />
          <button
            onClick={handleAddTask}
            className="px-6 py-4 bg-primary text-white rounded-3xl hover:bg-cyan-400 transition-colors font-semibold text-lg shadow-md w-full sm:w-auto"
          >
            Add
          </button>
        </div>

        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(100%); }
          }
          .animate-loading {
            animation: loading 1.5s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
