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
  const [animatedTasks, setAnimatedTasks] = useState<string[]>([]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const encouragement = encouragements[today.getDate() % encouragements.length];

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      let data = await getUserTodoList(user.id);

      const todayTasks = (data[todayStr] || []).filter(task => {
        const taskDate = new Date(task.createdAt);
        const taskDateStr = taskDate.toISOString().split('T')[0];
        return !(task.done && taskDateStr !== todayStr);
      });

      setTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user, todayStr]);

  const saveTodos = async (updatedTodos: TodoItem[], animateId?: string) => {
    if (!user) return;
    setTodos(updatedTodos);

    if (animateId) {
      setAnimatedTasks(prev => [...prev, animateId]);
      setTimeout(() => {
        setAnimatedTasks(prev => prev.filter(id => id !== animateId));
      }, 500);
    }

    await updateUserTodoList(user.id, { [todayStr]: updatedTodos });
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...todos, task];
    setNewTask('');
    saveTodos(updated);
  };

  const handleToggleDone = (taskId: string) => {
    const updated = todos.map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    saveTodos(updated, taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = todos.filter(t => t.id !== taskId);
    saveTodos(updated);
  };

  if (!isOpen) return null;

  const isOverdue = (task: TodoItem) => {
    return !task.done && new Date(task.createdAt) < new Date(new Date().setDate(today.getDate() - 1));
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const showProgress = doneCount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-full max-w-2xl p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] transition-transform scale-100 animate-fade-in-up">
        
        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary mb-4">{encouragement}</h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Today's Tasks</h3>
          <button onClick={onClose} className="text-red-500 font-bold text-3xl hover:text-red-600 transition">×</button>
        </div>

        {/* Loading Bar */}
        {loading && (
          <div className="relative w-full h-3 rounded-full overflow-hidden mb-4">
            <div className="absolute w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="absolute h-full w-1/3 bg-gradient-to-r from-primary to-cyan-400 rounded-full animate-loading"></div>
          </div>
        )}

        <ul className="space-y-3 mb-4">
          {todos.map(task => (
            <li key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
              <div className="flex items-center gap-4 w-full">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task.id)}
                  className={`w-8 h-8 accent-primary transform transition-all duration-300 ${animatedTasks.includes(task.id) ? 'scale-125 shadow-lg shadow-cyan-400/50' : ''}`}
                />
                <span className={`flex-1 text-lg ${task.done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                  {task.text}
                </span>
                {isOverdue(task) && (
                  <span className="ml-2 text-red-600 font-bold text-lg animate-pulse">⚠️ Overdue! Quick! ⏰</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Progress Bar تفاعلي وعصري */}
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

        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full"
          />
          <button
            onClick={handleAddTask}
            className="px-5 py-3 bg-primary text-white rounded-2xl hover:bg-cyan-400 transition-colors font-semibold w-full sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(100%); }
          }
          .animate-loading {
            animation: loading 1.5s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default TodoDialog;
