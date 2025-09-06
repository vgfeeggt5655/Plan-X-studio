// components/TodoDialog.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface Task {
  day: string;
  task: string;
  done: boolean;
}

interface TodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && user.todo_list) {
      try {
        const parsed: Task[] = JSON.parse(user.todo_list);
        setTasks(parsed.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()));
      } catch (e) {
        console.error('Failed to parse todo_list', e);
        setTasks([]);
      }
    }
  }, [user]);

  const toggleTaskDone = async (index: number) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
    if (user) {
      await updateUser({ ...user, todo_list: JSON.stringify(updated) });
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[80vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Todo List</h2>
        <ul className="space-y-2">
          {tasks.map((task, idx) => {
            const isLate = !task.done && task.day < today;
            return (
              <li
                key={idx}
                className={`flex justify-between items-center p-2 rounded-md ${
                  isLate ? 'bg-red-100 text-red-800' : task.done ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                }`}
              >
                <span>
                  <strong>{task.day}:</strong> {task.task}
                </span>
                <button
                  onClick={() => toggleTaskDone(idx)}
                  className={`px-3 py-1 rounded-full font-semibold ${
                    task.done ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  }`}
                >
                  {task.done ? 'Done' : 'Mark'}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-cyan-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
