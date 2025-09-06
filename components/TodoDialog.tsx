import React, { useState, useEffect } from 'react';
import { getUserTodoList, updateUserTodoList } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
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

  // Load user's todo list on open
  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      const data = await getUserTodoList(user.id);
      setTodos(data);
    })();
  }, [isOpen, user]);

  // Save updated todo list to server
  const saveTodos = async (updatedTodos: Record<string, TodoItem[]>) => {
    if (!user) return;
    setTodos(updatedTodos);
    await updateUserTodoList(user.id, updatedTodos);
  };

  const handleAddTask = (day: string) => {
    if (!newTask[day] || newTask[day].trim() === '') return;
    const updated = { ...todos };
    const task: TodoItem = { id: Date.now().toString(), text: newTask[day], done: false };
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50">
      <div className="bg-white dark:bg-slate-900 w-11/12 max-w-3xl p-6 rounded-xl shadow-lg overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Todo List</h2>
          <button onClick={onClose} className="text-red-500 font-bold text-xl">×</button>
        </div>

        {daysOfWeek.map(day => (
          <div key={day} className="mb-6">
            <h3 className="font-semibold text-lg mb-2">{day}</h3>

            {/* Tasks List */}
            <ul className="space-y-1 mb-2">
              {todos[day]?.map(task => (
                <li key={task.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
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
            <div className="flex gap-2">
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
            {todos[day]?.some(t => !t.done) && (
              <p className="text-red-500 text-sm mt-1">⚠ Some tasks are still unfinished!</p>
            )}

            {/* Simple progress/star rating */}
            {todos[day] && todos[day].length > 0 && (
              <div className="flex mt-1 gap-1">
                {todos[day].map(t => t.done ? '⭐' : '✩')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoDialog;
