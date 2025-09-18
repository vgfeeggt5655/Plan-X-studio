import React, { useState, useEffect } from 'react';

interface PomodoroTimerProps {
  open: boolean;
  onClose: () => void;
  timeLeft: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  mode: 'work' | 'shortBreak' | 'longBreak';
  setMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  setTimeLeft: (time: number) => void;
}

interface SessionStats {
  workTime: number;
  breakTime: number;
  sessions: number;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  open,
  onClose,
  timeLeft,
  running,
  start,
  pause,
  reset,
  mode,
  setMode,
  setTimeLeft
}) => {
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [initialTime, setInitialTime] = useState(timeLeft);
  const [stats, setStats] = useState<SessionStats>(() => {
    const savedStats = localStorage.getItem('pomodoro-stats');
    return savedStats ? JSON.parse(savedStats) : { workTime: 0, breakTime: 0, sessions: 0 };
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setInitialTime(timeLeft);
  }, [timeLeft]);

  // تحديث الإحصائيات كل ثانية أثناء التشغيل
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setStats(prev => {
        const newStats = { ...prev };
        if (mode === 'work') {
          newStats.workTime += 1;
        } else {
          newStats.breakTime += 1;
        }
        localStorage.setItem('pomodoro-stats', JSON.stringify(newStats));
        return newStats;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, mode]);

  // انتهاء الجلسة بدون تشغيل البريك تلقائياً
  useEffect(() => {
    if (timeLeft === 0 && running) {
      pause();
      setSessionComplete(true);
      if (mode === 'work') {
        setStats(prev => {
          const newStats = { ...prev, sessions: prev.sessions + 1 };
          localStorage.setItem('pomodoro-stats', JSON.stringify(newStats));
          return newStats;
        });
      }
    }
  }, [timeLeft, running, mode, pause]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowStats(false);
    }, 300);
  };

  if (!open && !isClosing) return null;

  const totalTime = initialTime;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const getModeConfig = () => {
    switch (mode) {
      case 'work': return { title: 'Pomodoro', color: '#6366F1', secondaryColor: '#818CF8', bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900', glowColor: 'rgba(99, 102, 241, 0.5)', description: 'Focus & Work', ringColor: 'ring-indigo-500/30' };
      case 'shortBreak': return { title: 'Short Break', color: '#10B981', secondaryColor: '#34D399', bgGradient: 'from-emerald-900/20 via-gray-900 to-gray-900', glowColor: 'rgba(16, 185, 129, 0.5)', description: 'Take a Break', ringColor: 'ring-emerald-500/30' };
      case 'longBreak': return { title: 'Long Break', color: '#8B5CF6', secondaryColor: '#A78BFA', bgGradient: 'from-purple-900/20 via-gray-900 to-gray-900', glowColor: 'rgba(139, 92, 246, 0.5)', description: 'Long Rest', ringColor: 'ring-purple-500/30' };
      default: return { title: 'Pomodoro', color: '#6366F1', secondaryColor: '#818CF8', bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900', glowColor: 'rgba(99, 102, 241, 0.5)', description: 'Focus & Work', ringColor: 'ring-indigo-500/30' };
    }
  };

  const config = getModeConfig();

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) return;
    setMode(newMode);
    setSessionComplete(false);
    const newTime = newMode === 'work' ? 25 * 60 : newMode === 'shortBreak' ? 5 * 60 : 15 * 60;
    setTimeLeft(newTime);
    setInitialTime(newTime);
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if (!isNaN(minutesNum) && minutesNum > 0 && minutesNum <= 120) {
      const newTime = minutesNum * 60;
      setTimeLeft(newTime);
      setInitialTime(newTime);
      setCustomTime('');
      setShowCustomInput(false);
      setSessionComplete(false);
    }
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const breakProgress = (stats.workTime + stats.breakTime) > 0 ? (stats.breakTime / (stats.workTime + stats.breakTime)) : 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-lg" onClick={handleClose}></div>

      <div className={`relative z-10 bg-gradient-to-br ${config.bgGradient} rounded-3xl shadow-2xl border border-gray-700/30 p-0 w-full max-w-md overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        {/* Tabs */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex bg-gray-700/30 rounded-2xl p-1 w-full max-w-sm">
            {[ { key: 'work', label: 'Pomodoro' }, { key: 'shortBreak', label: 'Short Break' }, { key: 'longBreak', label: 'Long Break' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleModeChange(tab.key as any)}
                disabled={running}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative rounded-xl ${mode === tab.key ? 'text-white bg-gray-600/40 shadow-md' : `text-gray-400 ${running ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 pt-24">
          {/* Timer Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border-8 border-gray-700/20"></div>
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id={`progress-gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={config.color} />
                    <stop offset="100%" stopColor={config.secondaryColor} />
                  </linearGradient>
                </defs>
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={`url(#progress-gradient-${mode})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${config.glowColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono font-bold text-white mb-2">{minutes}:{seconds}</div>
                <div className="text-sm text-gray-400 mb-1">{Math.round(progress * 100)}% Complete</div>
                {running && <div className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/30 uppercase tracking-widest mt-2">{mode === 'work' ? 'FOCUS TIME' : 'BREAK TIME'}</div>}
                {sessionComplete && <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse mt-2">Session Complete! 🎉</div>}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-6">
            {running ? (
              <button onClick={pause} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 min-w-[120px] justify-center">
                Pause
              </button>
            ) : (
              <button onClick={start} disabled={timeLeft === 0} className={`px-8 py-3 font-bold rounded-xl shadow-lg flex items-center gap-2 min-w-[120px] justify-center ${timeLeft === 0 ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'hover:scale-105 text-white'}`} style={timeLeft > 0 ? { background: `linear-gradient(135deg, ${config.color}, ${config.secondaryColor})` } : {}}>
                {timeLeft === 0 ? 'Done' : 'Start'}
              </button>
            )}
            <button onClick={() => { reset(); setSessionComplete(false); setInitialTime(mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60); }} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
              Reset
            </button>
          </div>

          {/* Custom Time */}
          <div className="text-center mb-4">
            {!showCustomInput ? (
              <button onClick={() => setShowCustomInput(true)} disabled={running} className={`text-sm px-6 py-2 rounded-xl bg-gray-700/40 text-gray-300 transition-all duration-200 font-medium ${running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/60 hover:text-white'}`}>
                ⚙️ Custom Time
              </button>
            ) : (
              <div className="bg-gray-800/70 p-4 rounded-2xl border border-gray-700/30 mx-auto max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">Set Custom Time</h3>
                  <button onClick={() => { setShowCustomInput(false); setCustomTime(''); }} className="text-gray-400 hover:text-white">X</button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="120" value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="Minutes (1-120)" className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder:text-gray-400" />
                  <button onClick={applyCustomTime} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">Set</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="text-center">
            <button onClick={() => setShowStats(!showStats)} className="text-sm px-6 py-2 rounded-xl bg-gray-700/40 text-gray-300 hover:bg-gray-700/60 hover:text-white">
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
          </div>
          {showStats && (
            <div className="mt-6 bg-gray-800/40 p-4 rounded-2xl border border-gray-700/30">
              <h3 className="text-white font-medium mb-4 text-center">Session Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#374151" strokeWidth="2" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeDasharray="100 0" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{stats.sessions}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Sessions</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#374151" strokeWidth="2" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${breakProgress * 100} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{Math.floor(stats.breakTime / 60)}m</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Break Time</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Focus Time:</span>
                  <span className="text-white font-medium">{Math.floor(stats.workTime / 60)}m</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">Focus/Break Ratio:</span>
                  <span className="text-white font-medium">{stats.breakTime > 0 ? (stats.workTime / stats.breakTime).toFixed(1) : '∞'} : 1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/70 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 z-10">
          X
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
