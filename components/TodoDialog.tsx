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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // اختيار عبارة تشجيعية بناءً على اليوم
  const encouragement = encouragements[today.getDate() % encouragements.length];

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      let data = await getUserTodoList(user.id);

      // جلب مهام اليوم الحالي فقط وحذف المهام المنجزة بعد يوم كامل
      const todayTasks = (data[todayStr] || []).filter(task => {
        const taskDate = new Date(task.createdAt);
        const taskDateStr = taskDate.toISOString().split('T')[0];
        return !(task.done && taskDateStr !== todayStr);
      });

      setTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user, todayStr]);

  const saveTodos = async (updatedTodos: TodoItem[]) => {
    if (!user) return;
    setTodos(updatedTodos);
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
    saveTodos(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = todos.filter(t => t.id !== taskId);
    saveTodos(updated);
  };

  if (!isOpen) return null;

  const isOverdue = (task: TodoItem) => {
    return !task.done && new Date(task.createdAt) < new Date(new Date().setDate(today.getDate() - 1));
  };

  const progress = todos.length ? (todos.filter(t => t.done).length / todos.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-12 z-50">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md w-11/12 max-w-2xl p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[80vh] transition-transform scale-100 animate-fade-in-up">
        
        {/* عبارة تشجيعية */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary mb-4">{encouragement}</h2>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Today's Tasks</h3>
          <button onClick={onClose} className="text-red-500 font-bold text-3xl hover:text-red-600 transition">×</button>
        </div>

        {loading && (
          <div className="mb-4 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-2 w-full animate-pulse" />
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
                  className="w-7 h-7 accent-primary"
                />
                <span className={`flex-1 text-lg ${task.done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                  {task.text}
                </span>

                {/* التحذير للمهام المتأخرة */}
                {isOverdue(task) && (
                  <span className="ml-2 text-red-600 font-bold text-lg animate-pulse">⚠️ Oops! Overdue!</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
          <div className="h-2 bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
        </div>

        {/* إضافة مهمة */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddTask}
            className="px-5 py-3 bg-primary text-white rounded-2xl hover:bg-cyan-400 transition-colors font-semibold"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
