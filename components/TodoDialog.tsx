import React, { useState, useEffect, useRef } from 'react';
import { getUserTodoList, updateUserTodoList } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface TodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodoDialog: React.FC<TodoDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'alphabetical'>('priority');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Load todos with initial loading state
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const loadTodos = async () => {
      setLoading(true);
      try {
        const data = await getUserTodoList(user.id);
        let todayTasks = data[todayStr] || [];

        // Clean up completed old tasks
        todayTasks = todayTasks.filter(task => {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          if (task.done && taskDate !== todayStr) return false;
          return true;
        });

        setTodos(todayTasks);
      } catch (error) {
        console.error('Failed to load todos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, [isOpen, user, todayStr]);

  // Focus input when add form shows
  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddForm]);

  const saveTodos = async (updatedTodos: TodoItem[]) => {
    if (!user) return;
    try {
      setTodos(updatedTodos);
      await updateUserTodoList(user.id, { [todayStr]: updatedTodos });
    } catch (error) {
      console.error('Failed to save todos:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    
    const task: TodoItem = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      priority: newTaskPriority,
      category: newTaskCategory.trim() || undefined
    };
    
    const updated = [...todos, task];
    setNewTask('');
    setNewTaskCategory('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
    await saveTodos(updated);
  };

  const handleToggleDone = async (taskId: string) => {
    const task = todos.find(t => t.id === taskId);
    const updated = todos.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    
    // Show celebration when completing a task
    if (task && !task.done) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    
    await saveTodos(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = todos.filter(t => t.id !== taskId);
    await saveTodos(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewTask('');
      setNewTaskCategory('');
    }
  };

  // Filter and sort todos
  const getFilteredAndSortedTodos = () => {
    let filtered = todos;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.category && todo.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(t => !t.done);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.done);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (a.done !== b.done) return a.done ? 1 : -1;
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === 'alphabetical') {
        return a.text.localeCompare(b.text);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-200';
      case 'medium': return 'text-yellow-500 border-yellow-200';
      case 'low': return 'text-green-500 border-green-200';
      default: return 'text-gray-500 border-gray-200';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '🌱';
      default: return '📝';
    }
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const filteredTodos = getFilteredAndSortedTodos();
  const categories = [...new Set(todos.filter(t => t.category).map(t => t.category))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl p-6 rounded-3xl shadow-2xl max-h-[95vh]
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 flex flex-col overflow-hidden">

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-text-primary text-lg">Loading your tasks...</p>
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
              <div className="h-2 bg-gradient-to-r from-primary to-cyan-400 rounded animate-[loading-bar_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">Today's Tasks</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-red-500 font-bold text-3xl hover:scale-110 transition-all duration-200"
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            {todos.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Progress: {doneCount}/{todos.length} tasks completed
                  </span>
                  <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="alphabetical">Sort A-Z</option>
              </select>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(category => (
                  <span key={category} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    📂 {category}
                  </span>
                ))}
              </div>
            )}

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto mb-4">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {searchTerm ? 'No tasks match your search.' : 'No tasks yet. Add your first task!'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredTodos.map(task => {
                    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
                    const showWarning = !task.done && taskDate < todayStr;

                    return (
                      <li
                        key={task.id}
                        className={`group flex items-center justify-between p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 ${
                          task.done 
                            ? 'bg-gray-100 dark:bg-gray-800 opacity-70' 
                            : 'bg-white dark:bg-gray-800 hover:bg-white/70 dark:hover:bg-gray-700/70'
                        }`}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleToggleDone(task.id)}
                            className="w-6 h-6 transform transition-all duration-300 hover:scale-110"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={getPriorityEmoji(task.priority)}></span>
                              <span className={`text-lg ${task.done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                                {task.text}
                              </span>
                              {task.category && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                  {task.category}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                              <span>{new Date(task.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            </div>
                          </div>

                          {showWarning && (
                            <span className="ml-2 text-red-600 font-bold text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 animate-pulse">
                              ⚠ Overdue!
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 transition-all text-2xl hover:scale-110 ml-2"
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Add Task Section */}
            {showAddForm ? (
              <div className="border-t pt-4 space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What do you need to do?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Category (optional)"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition text-sm"
                  />
                  
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="low">🌱 Low</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="high">🔥 High</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    disabled={!newTask.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTask('');
                      setNewTaskCategory('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-primary font-medium"
              >
                + Add New Task
              </button>
            )}
          </>
        )}

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        <style>{`
          @keyframes loading-bar { 
            0% { transform: translateX(-100%); } 
            50% { transform: translateX(0); } 
            100% { transform: translateX(100%); } 
          }
          .animate-[loading-bar_1.5s_ease-in-out_infinite] { 
            animation: loading-bar 1.5s ease-in-out infinite; 
          }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
