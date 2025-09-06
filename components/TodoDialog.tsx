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

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      let data = await getUserTodoList(user.id);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // جلب مهام اليوم الحالي فقط
      const todayTasks = (data[todayStr] || []).filter(task => {
        const taskDate = new Date(task.createdAt);
        const taskDateStr = taskDate.toISOString().split('T')[0];

        // حذف المهام المنجزة بعد يوم كامل
        if (task.done && taskDateStr !== todayStr) return false;

        return true;
      });

      setTodos(todayTasks);
      setLoading(false);
    })();
  }, [isOpen, user]);

  const saveTodos = async (updatedTodos: TodoItem[]) => {
    if (!user) return;
    setTodos(updatedTodos);

    const today = new Date().toISOString().split('T')[0];
    await updateUserTodoList(user.id, { [today]: updatedTodos });
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

  const hasOverdueTasks = todos.some(t => !t.done && new Date(t.createdAt) < new Date(new Date().setDate(new Date().getDate() - 1)));

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-12 z-50">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md w-11/12 max-w-2xl p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[80vh] transition-transform scale-100 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary">Today's Tasks</h2>
          <button onClick={onClose} className="text-red-500 font-bold text-3xl hover:text-red-600 transition">×</button>
        </div>

        {loading && (
          <div className="mb-4 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-2 w-full animate-pulse" />
          </div>
        )}

        <ul className="space-y-2 mb-4">
          {todos.map(task => (
            <li key={task.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task.id)}
                  className="w-5 h-5 accent-primary"
                />
                <span className={task.done ? 'line-through text-gray-400' : 'text-text-primary'}>
                  {task.text}
                </span>
              </div>
              <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 font-bold hover:text-red-600 transition">×</button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddTask}
            className="px-5 py-3 bg-primary text-white rounded-xl hover:bg-cyan-400 transition-colors"
          >
            Add
          </button>
        </div>

        {hasOverdueTasks && (
          <p className="text-red-500 text-sm mt-4 font-semibold">
            ⚠ You have overdue tasks!
          </p>
        )}
      </div>
    </div>
  );
};

export default TodoDialog;
