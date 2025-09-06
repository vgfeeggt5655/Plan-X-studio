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
  const [localTodos, setLocalTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      const data = await getUserTodoList(user.id);
      let todayTasks = data[todayStr] || [];

      // حذف المهام المنجزة والقديمة تلقائيًا
      todayTasks = todayTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        if (task.done && taskDate !== todayStr) return false;
        return true;
      });

      setTodos(todayTasks);
      setLocalTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user, todayStr]);

  // حفظ التعديلات دفعة واحدة عند الإغلاق أو غلق التاب
  const saveTodos = async () => {
    if (!user) return;
    setSaving(true);
    await updateUserTodoList(user.id, { [todayStr]: localTodos });
    setTodos(localTodos);
    setSaving(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(localTodos) !== JSON.stringify(todos)) {
        e.preventDefault();
        e.returnValue = '';
        saveTodos();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && JSON.stringify(localTodos) !== JSON.stringify(todos)) {
        saveTodos();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [localTodos, todos, user]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = { id: Date.now().toString(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() };
    setLocalTodos([...localTodos, task]);
    setNewTask('');
  };

  const handleToggleDone = (taskId: string) => {
    const updated = localTodos.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setLocalTodos(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = localTodos.filter(t => t.id !== taskId);
    setLocalTodos(updated);
  };

  const handleClose = async () => {
    await saveTodos();
    onClose();
  };

  const doneCount = localTodos.filter(t => t.done).length;
  const progress = localTodos.length ? (doneCount / localTodos.length) * 100 : 0;
  const showProgress = doneCount > 0;

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

        {saving && (
          <div className="text-center text-sm font-semibold text-primary mb-2">
            Saving your changes... 💾
          </div>
        )}

        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-primary mb-4">
          Today's Tasks
        </h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">Tasks</h3>
          <button
            onClick={handleClose}
            className="text-red-500 font-bold text-3xl hover:text-red-600 transition"
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
          {localTodos.map(task => {
            const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
            const showWarning = !task.done && taskDate < todayStr; // التحذير فقط للمهام القديمة وغير المنجزة

            return (
              <li
                key={task.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 hover:bg-white/70 dark:hover:bg-gray-700/70"
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
          @keyframes loading-bar { 0% { transform: translateX(-100%);} 50% { transform: translateX(0);} 100% { transform: translateX(100%);} }
          .animate-[loading-bar_1.5s_ease-in-out_infinite] { animation: loading-bar 1.5s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
