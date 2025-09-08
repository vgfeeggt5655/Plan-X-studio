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

  // حفظ تلقائي مع debounce 800ms
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
    // حذف مع animation
    const element = document.getElementById(taskId);
    if (element) {
      element.classList.add('animate-delete');
      setTimeout(() => setTodos(prev => prev.filter(t => t.id !== taskId)), 300);
    } else {
      setTodos(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 animate-dialog-open">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl p-6 rounded-3xl shadow-2xl max-h-[90vh]
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 flex flex-col overflow-y-auto animate-fade-in"
      >
        {/* لودنج بار shimmer */}
        {loading && (
          <div className="w-full h-3 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div className="absolute h-3 w-1/2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 animate-shimmer rounded-full" />
          </div>
        )}

        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-primary mb-4 opacity-0 animate-fade-in-delay">
          Today's Tasks
        </h2>

        <div className="flex justify-between items-center mb-4 opacity-0 animate-fade-in-delay">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">
            Tasks
          </h3>
          <button
            onClick={onClose}
            className="text-red-500 font-bold text-3xl hover:text-red-600 transition"
          >
            ×
          </button>
        </div>

        {doneCount > 0 && (
          <div className="w-full h-3 rounded-full mb-4 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4ade80, #06b6d4)' }}
            />
          </div>
        )}

        <ul className="space-y-3 mb-4">
          {todos.map(task => {
            const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
            const showWarning = !task.done && taskDate < todayStr;

            return (
              <li
                id={task.id}
                key={task.id}
                className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 hover:bg-white/70 dark:hover:bg-gray-700/70 animate-fade-in-item animate-pop ${
                  task.done ? 'animate-toggle-done' : ''
                }`}
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
                  {showWarning && (
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
            );
          })}
        </ul>

        <div className="flex gap-2 mt-auto opacity-0 animate-fade-in-delay">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition"
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-cyan-400 transition"
          >
            Add
          </button>
        </div>

        <style>{`
          @keyframes fade-in { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }
          @keyframes pop-bounce { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 70% { transform: scale(0.95); } 100% { transform: scale(1); } }
          @keyframes toggle-done { 0% { transform: scale(1); color: #000; } 50% { transform: scale(0.95); color: #06b6d4; } 100% { transform: scale(1); color: #06b6d4; } }
          @keyframes delete { 0% { opacity:1; transform: scale(1);} 100% { opacity:0; transform: scale(0.5);} }
          @keyframes dialog-open { 0% { opacity: 0; transform: scale(0.95);} 100% { opacity:1; transform: scale(1);} }

          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          .animate-fade-in-delay { animation: fade-in 0.4s ease-out forwards; }
          .animate-fade-in-item { animation: fade-in 0.3s ease-out forwards; }
          .animate-shimmer { animation: shimmer 1.5s linear infinite; }
          .animate-pop { animation: pop-bounce 0.5s ease-out forwards; }
          .animate-toggle-done { animation: toggle-done 0.3s ease-out forwards; }
          .animate-delete { animation: delete 0.3s ease-out forwards; }
          .animate-dialog-open { animation: dialog-open 0.3s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
