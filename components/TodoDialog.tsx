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

const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Record<string, TodoItem[]>>({});
  const [newTask, setNewTask] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load user's todo list on open
  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      let data = await getUserTodoList(user.id);

      // حذف المهام القديمة المنجزة تلقائيًا
      const today = new Date();
      for (const day in data) {
        data[day] = data[day].filter(task => {
          if (!task.done) return true;
          const taskDate = new Date(task.createdAt);
          return !(taskDate.getDate() !== today.getDate() || taskDate.getMonth() !== today.getMonth() || taskDate.getFullYear() !== today.getFullYear());
        });
      }

      setTodos(data);
      setLoading(false);
    })();
  }, [isOpen, user]);

  const saveTodos = async (updatedTodos: Record<string, TodoItem[]>) => {
    if (!user) return;
    setTodos(updatedTodos);
    await updateUserTodoList(user.id, updatedTodos);
  };

  const handleAddTask = (day: string) => {
    if (!newTask[day] || newTask[day].trim() === '') return;
    const updated = { ...todos };
    const task: TodoItem = { id: Date.now().toString(), text: newTask[day], done: false, createdAt: new Date().toISOString() };
    if (!updated[day]) updated[day] = [];
    updated[day].push(task);
    setNewTask({ ...newTask, [day]: '' });
    saveTodos(updated);
  };

  const handleToggleDone = (day: string, taskId: string) => {
    const updated = { ...todos };
    const task = updated[day].find(t => t.id === taskId);
    if (!task) return;
    task.done = !task.done;
    saveTodos(updated);
  };

  const handleDeleteTask = (day: string, taskId: string) => {
    const updated = { ...todos };
    updated[day] = updated[day].filter(t => t.id !== taskId);
    saveTodos(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-12 z-50">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md w-11/12 max-w-4xl p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[80vh] transition-transform scale-100 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary">Todo List</h2>
          <button onClick={onClose} className="text-red-500 font-bold text-2xl">×</button>
        </div>

        {loading && (
          <div className="mb-4 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-2 w-full animate-pulse" />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {daysOfWeek.map(day => {
            const dayTasks = todos[day] || [];
            const doneCount = dayTasks.filter(t => t.done).length;
            const progress = dayTasks.length ? (doneCount / dayTasks.length) * 100 : 0;
            return (
              <div key={day} className="bg-surface/80 dark:bg-gray-800/70 backdrop-blur-sm border border-border-color rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-text-primary">{day}</h3>
                  <span className="text-sm text-text-secondary">{Math.round(progress)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3">
                  <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Tasks List */}
                <ul className="space-y-2 flex-1 overflow-y-auto mb-2">
                  {dayTasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-900/50 rounded shadow-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleDone(day, task.id)}
                        />
                        <span className={task.done ? 'line-through text-gray-400' : ''}>{task.text}</span>
                      </div>
                      <button onClick={() => handleDeleteTask(day, task.id)} className="text-red-500 font-bold">×</button>
                    </li>
                  ))}
                </ul>

                {/* Add Task */}
                <div className="flex gap-2 mt-auto">
                  <input
                    type="text"
                    placeholder="Add a task..."
                    value={newTask[day] || ''}
                    onChange={e => setNewTask({ ...newTask, [day]: e.target.value })}
                    className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <button
                    onClick={() => handleAddTask(day)}
                    className="px-3 py-2 bg-primary text-white rounded hover:bg-cyan-400 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Warning for unfinished past tasks */}
                {dayTasks.some(t => !t.done && new Date(t.createdAt) < new Date()) && (
                  <p className="text-red-500 text-sm mt-2">⚠ Some tasks are still unfinished!</p>
                )}

                {/* Stars for done tasks */}
                {dayTasks.length > 0 && (
                  <div className="flex mt-2 gap-1">
                    {dayTasks.map(t => t.done ? '⭐' : '✩')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
