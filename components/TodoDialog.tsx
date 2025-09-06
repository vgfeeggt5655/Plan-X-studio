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
  const [saving, setSaving] = useState(false);
  const [animateNewId, setAnimateNewId] = useState<string | null>(null);
  const [animateRemoveId, setAnimateRemoveId] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const encouragements = [
    "Let's get started! 💪",
    "Don't give up! 🌈",
    "Keep moving! 🏃‍♂️",
    "Nice start! ✨",
    "Halfway there! 😎",
    "Keep it going! 💪",
    "You're on fire! 🔥",
    "Great work! Keep pushing! 🚀",
    "Almost there! You're a star! 🌟",
    "All tasks done! 🎉 Amazing job!"
  ];

  const encouragement = (() => {
    if (!todos.length) return encouragements[0];
    const doneCount = todos.filter(t => t.done).length;
    if (doneCount === todos.length && todos.length > 0) {
      return "Egypt is proud of you! 🇪🇬😂";
    }
    const progress = doneCount / todos.length;
    return encouragements[Math.floor(progress * 10)];
  })();

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

  const saveTodos = async (updatedTodos: TodoItem[]) => {
    if (!user) return;
    setTodos(updatedTodos);
    setSaving(true);
    await updateUserTodoList(user.id, { [todayStr]: updatedTodos });
    setSaving(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = { id: Date.now().toString(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() };
    setAnimateNewId(task.id);
    saveTodos([...todos, task]);
    setNewTask('');
    setTimeout(() => setAnimateNewId(null), 500);
  };

  const handleToggleDone = (taskId: string) => {
    const updated = todos.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    saveTodos(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    setAnimateRemoveId(taskId);
    setTimeout(() => {
      const updated = todos.filter(t => t.id !== taskId);
      saveTodos(updated);
      setAnimateRemoveId(null);
    }, 400);
  };

  const isTaskOverdue = (task: TodoItem) => {
    const taskDate = new Date(task.createdAt);
    const diff = today.getTime() - taskDate.getTime();
    return !task.done && diff > 24 * 60 * 60 * 1000;
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const showProgress = doneCount > 0;
  const canClose = !saving;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-2xl p-6 rounded-3xl shadow-2xl max-h-[90vh]
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 flex flex-col overflow-y-auto">

        {loading && (
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div className="h-2 bg-primary rounded animate-[loading-bar_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-primary mb-4">
          {encouragement}
        </h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">Today's Tasks</h3>
          {!canClose && <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 ml-4">Saving tasks… please wait!</p>}
          <button
            onClick={() => canClose && onClose()}
            disabled={!canClose}
            className={`text-red-500 font-bold text-3xl transition ${!canClose ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
          >
            ×
          </button>
        </div>

        {showProgress && (
          <div className="w-full h-3 rounded-full mb-4 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, #4ade80, #06b6d4)` }}
            />
          </div>
        )}

        <ul className="space-y-3 mb-4">
          {todos.map(task => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300
                hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 hover:bg-white/70 dark:hover:bg-gray-700/70
                ${animateNewId === task.id ? 'animate-from-input' : ''} ${animateRemoveId === task.id ? 'animate-to-input' : ''}`}
            >
              <div className="flex items-center gap-4 w-full">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task.id)}
                  className="w-8 h-8 transform transition-all duration-300"
                />
                <span className={`flex-1 text-sm sm:text-base md:text-lg lg:text-xl ${task.done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                  {task.text}
                </span>

                {isTaskOverdue(task) && (
                  <span className="ml-2 text-red-600 font-bold text-xs sm:text-sm md:text-base px-2 py-1 rounded bg-red-100 dark:bg-red-900 animate-pulse">
                    ⚠ Overdue! 😡
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-gray-500 hover:text-red-600 transition text-2xl"
                title="Delete Task"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mt-auto">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-cyan-400 transition"
          >
            Add
          </button>
        </div>

        <style>{`
          @keyframes from-input { 0% { opacity:0; transform: translateY(20px) scale(0.8);} 100% {opacity:1; transform: translateY(0) scale(1);} }
          @keyframes to-input { 0% { opacity:1; transform: translateY(0) scale(1);} 100% {opacity:0; transform: translateY(20px) scale(0.8);} }
          @keyframes loading-bar { 0% { transform: translateX(-100%);} 50% { transform: translateX(0);} 100% { transform: translateX(100%);} }
          .animate-from-input { animation: from-input 0.4s ease-out; }
          .animate-to-input { animation: to-input 0.4s ease-in forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
