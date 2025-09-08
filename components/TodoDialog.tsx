import React, { useState, useEffect, useRef } from 'react';
import { getUserTodoList, updateUserTodoList } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
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
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !user) return;
    
    const loadTodos = async () => {
      setLoading(true);
      try {
        const data = await getUserTodoList(user.id);
        let todayTasks = data[todayStr] || [];

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
      priority: newTaskPriority
    };
    
    const updated = [...todos, task];
    setNewTask('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
    await saveTodos(updated);
  };

  const handleToggleDone = async (taskId: string) => {
    const task = todos.find(t => t.id === taskId);
    const updated = todos.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    
    if (task && !task.done) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);
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
    }
  };

  const getFilteredTodos = () => {
    let filtered = todos;

    if (filter === 'pending') {
      filtered = filtered.filter(t => !t.done);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.done);
    }

    // Sort by priority and completion status
    filtered.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return filtered;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const doneCount = todos.filter(t => t.done).length;
  const progress = todos.length ? (doneCount / todos.length) * 100 : 0;
  const filteredTodos = getFilteredTodos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 text-white">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
            </div>
            <p className="mt-6 text-xl font-light text-slate-300">Loading your tasks...</p>
          </div>
        ) : (
          <>
            {/* Elegant Header */}
            <div className="p-8 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-light text-white mb-2 tracking-wide">Today's Focus</h1>
                  <p className="text-slate-400 text-sm font-light">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors text-2xl font-light hover:rotate-90 transform transition-transform duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Progress Section */}
              {todos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm font-light">
                      {doneCount} of {todos.length} completed
                    </span>
                    <span className="text-cyan-400 font-medium text-sm">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Simple Filter */}
            <div className="px-8 pb-6">
              <div className="flex gap-1 bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
                {['all', 'pending', 'completed'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      filter === filterOption
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {filterOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 px-8 overflow-y-auto">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4 opacity-50">✨</div>
                  <p className="text-slate-400 text-lg font-light">
                    {todos.length === 0 ? 'Ready for a productive day?' : 'No tasks in this view'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredTodos.map((task, index) => {
                    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
                    const isOverdue = !task.done && taskDate < todayStr;

                    return (
                      <div
                        key={task.id}
                        className={`group relative p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                          task.done 
                            ? 'bg-slate-800/30 border border-slate-700/30' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: 'slideInUp 0.3s ease-out forwards'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleToggleDone(task.id)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center hover:scale-110 ${
                              task.done 
                                ? 'bg-gradient-to-r from-green-400 to-blue-500 border-transparent' 
                                : 'border-slate-500 hover:border-cyan-400'
                            }`}
                          >
                            {task.done && <span className="text-white text-sm">✓</span>}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                              <p className={`text-lg font-light leading-relaxed transition-all duration-300 ${
                                task.done 
                                  ? 'line-through text-slate-500' 
                                  : 'text-white'
                              }`}>
                                {task.text}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                task.priority === 'high' 
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }`}>
                                {task.priority}
                              </span>
                              
                              <span className="text-slate-500 text-xs">
                                {new Date(task.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>

                              {isOverdue && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-medium animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200 text-xl hover:scale-110"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Task Section */}
            <div className="p-8 pt-6">
              {showAddForm ? (
                <div className="space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="What needs to be done?"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 backdrop-blur-sm transition-all duration-200"
                  />
                  
                  <div className="flex gap-3">
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm"
                    >
                      <option value="high" className="bg-slate-800">🔴 High Priority</option>
                      <option value="medium" className="bg-slate-800">🟡 Medium Priority</option>
                      <option value="low" className="bg-slate-800">🟢 Low Priority</option>
                    </select>
                    
                    <button
                      onClick={handleAddTask}
                      disabled={!newTask.trim()}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      Add Task
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTask('');
                      }}
                      className="px-4 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-600/50 rounded-2xl text-slate-400 hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-300 font-light text-lg hover:bg-white/5 backdrop-blur-sm group"
                >
                  <span className="group-hover:scale-110 inline-block transition-transform duration-200">+</span> Add new task
                </button>
              )}
            </div>
          </>
        )}

        {/* Celebration */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">✨</div>
          </div>
        )}

        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animation-delay-150 {
            animation-delay: 150ms;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TodoDialog;
