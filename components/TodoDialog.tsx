import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUser } from '../services/authService';
import dayjs from 'dayjs';

interface TodoDialogProps {
  open: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<TodoDialogProps> = ({ open, onClose }) => {
  const { currentUser, setCurrentUser } = useAuth();
  const [newTask, setNewTask] = useState('');

  if (!open) return null;

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    const updatedTasks = [
      ...(currentUser?.tasks || []),
      { text: newTask, date: dayjs().format('YYYY-MM-DD') },
    ];

    const updatedUser = { ...currentUser, tasks: updatedTasks };
    setCurrentUser(updatedUser);

    await updateUser(updatedUser);
    setNewTask('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">مهامي</h2>
          <button onClick={onClose} className="text-red-500 font-bold">
            x
          </button>
        </div>

        <ul className="mb-4 max-h-40 overflow-y-auto">
          {currentUser?.tasks?.map((task, index) => (
            <li key={index} className="flex justify-between items-center border-b py-1">
              <span>{task.text}</span>
              <span className="text-sm text-gray-500">{task.date}</span>
            </li>
          ))}
        </ul>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="أضف مهمة جديدة"
            className="border rounded px-2 py-1 flex-1"
          />
          <button
            onClick={handleAddTask}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDialog;
