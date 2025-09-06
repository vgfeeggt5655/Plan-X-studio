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

// عبارات تشجيعية متغيرة حسب اليوم
const baseEncouragements = [
  "Keep going! 💪",
  "You're doing great! 🌟",
  "Crush your tasks today! 🚀",
  "Almost there! 🏁",
  "Stay awesome! 😎",
  "Every task counts! ✅",
  "Make today amazing! 🌈"
];

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const getEncouragement = () => {
    if (!todos.length) return baseEncouragements[today.getDate() % baseEncouragements.length];
    const progress = todos.filter(t => t.done).length / todos.length;
    if (progress === 1) return "All tasks done! 🎉 Amazing job!";
    if (progress > 0.5) return "Halfway there! Keep it up! 😎";
    return "Let's get started! 💪";
  };

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

  const saveTodos = async (updatedTodos: TodoItem[], taskChangedId?: string) => {
    if (!user) return;
    const prevDoneCount = todos.filter(t => t.done).length;
    const newDoneCount = updatedTodos.filter(t => t.done).length;

    if (newDoneCount > prevDoneCount) setCelebrate(true);

    setTodos(updatedTodos);
    setSaving(true);
    await updateUserTodoList(user.id, { [todayStr]: updatedTodos });
    setSaving(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task: TodoItem = { id: Date.now().toString(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() };
    saveTodos([...todos, task], task.id);
    setNewTask('');
  };

  const handleToggleDone = (taskId: string) => {
    const updated = todos.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    saveTodos(updated, taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = todos.filter(t => t.id !== taskId);
    saveTodos(updated, taskId);
  };

  if (!isOpen) return null;

  const isTaskOverdue = (task: TodoItem) => {
    const taskDate = new Date(task.createdAt);
    const diff = today.getTime() - taskDate.getTime();
    return !task.done && diff > 24 * 60 * 60 * 1000;
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const showProgress = doneCount > 0;
  const canClose = !saving;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-2xl p-6 rounded-3xl shadow-2xl max-h-[90vh]
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 flex flex-col overflow-y-auto">

        {/* Sparkle effect عند اكتمال المهمة */}
        {celebrate && doneCount === todos.length && todos.length > 0 && (
          <div className="absolute inset-0 pointer-events-none animate-pulse-sparkle"></div>
        )}

        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary mb-4">{getEncouragement()}</h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Today's Tasks</h3>
          {!canClose && <p className="text-sm text-gray-600 dark:text-gray-300 ml-4">Saving tasks… please wait!</p>}
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
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, #4ade80, #06b6d4)`,
              }}
            />
          </div>
        )}

        <ul className="space-y-3 mb-4">
          {todos.map(task => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-200
                hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 hover:bg-white/70 dark:hover:bg-gray-700/70`}
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

                {/* Emojis التفاعلية */}
                {isTaskOverdue(task) && (
                  <span className="ml-2 text-red-600 font-bold text-sm px-2 py-1 rounded bg-red-100 dark:bg-red-900 animate-pulse">
                    ⚠ Overdue! 😡
                  </span>
                )}
                {task.done && !isTaskOverdue(task) && (
                  <span className="ml-2 text-green-600 font-bold text-sm px-2 py-1 rounded bg-green-100 dark:bg-green-900 animate-pulse">
                    ✅ Good job! 🎉
                  </span>
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

        <div className="flex gap-3 flex-col sm:flex-row mt-4">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-4 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary w-full text-lg font-medium shadow-md transition-all hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50"
          />
          <button
            onClick={handleAddTask}
            className="px-6 py-4 bg-primary text-white rounded-3xl hover:bg-cyan-400 transition-colors font-semibold text-lg shadow-md w-full sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
