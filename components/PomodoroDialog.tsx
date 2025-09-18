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
  setTimeLeft,
}) => {
  const [initialTime, setInitialTime] = useState(timeLeft);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats>(() => {
    const saved = localStorage.getItem('pomodoro-stats');
    return saved ? JSON.parse(saved) : { workTime: 0, breakTime: 0, sessions: 0 };
  });
  const [showStats, setShowStats] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Update initial time when timeLeft changes externally
  useEffect(() => {
    setInitialTime(timeLeft);
  }, [timeLeft]);

  // Handle session completion
  useEffect(() => {
    if (timeLeft === 0 && running) {
      pause();
      setSessionComplete(true);
      if (mode === 'work') {
        setStats(prev => {
          const updated = { ...prev, workTime: prev.workTime + initialTime, sessions: prev.sessions + 1 };
          localStorage.setItem('pomodoro-stats', JSON.stringify(updated));
          return updated;
        });
      } else {
        setStats(prev => {
          const updated = { ...prev, breakTime: prev.breakTime + initialTime };
          localStorage.setItem('pomodoro-stats', JSON.stringify(updated));
          return updated;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, running]);

  // Smooth close
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowStats(false);
    }, 300);
  };

  if (!open && !isClosing) return null;

  // Timer circle calculations
  const totalTime = initialTime;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  // Mode configuration
  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return { color: '#6366F1', secondaryColor: '#818CF8', glowColor: 'rgba(99,102,241,0.5)' };
      case 'shortBreak':
        return { color: '#10B981', secondaryColor: '#34D399', glowColor: 'rgba(16,185,129,0.5)' };
      case 'longBreak':
        return { color: '#8B5CF6', secondaryColor: '#A78BFA', glowColor: 'rgba(139,92,246,0.5)' };
      default:
        return { color: '#6366F1', secondaryColor: '#818CF8', glowColor: 'rgba(99,102,241,0.5)' };
    }
  };

  const config = getModeConfig();

  // Mode change handler
  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) return;
    setMode(newMode);
    setSessionComplete(false);
    let newTime = 25 * 60;
    if (newMode === 'shortBreak') newTime = 5 * 60;
    if (newMode === 'longBreak') newTime = 15 * 60;
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

  // Stats circle percentages
  const workProgress = stats.workTime > 0 ? Math.min(stats.workTime / 60 / 60, 1) : 0; // normalize per hour goal
  const breakProgress = stats.breakTime > 0 ? Math.min(stats.breakTime / 60 / 60, 1) : 0;
  const sessionProgress = stats.sessions > 0 ? Math.min(stats.sessions / 8, 1) : 0; // assume goal 8 sessions

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isClosing ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-lg" onClick={handleClose}></div>

      <div className="relative z-10 bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex justify-center mb-6 gap-2">
          {['work', 'shortBreak', 'longBreak'].map((tab) => (
            <button
              key={tab}
              disabled={running}
              onClick={() => handleModeChange(tab as any)}
              className={`px-4 py-2 rounded-xl font-medium text-white ${mode === tab ? 'bg-gray-700' : 'bg-gray-800/50'}`}
            >
              {tab === 'work' ? 'Pomodoro' : tab === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className="flex justify-center mb-6 relative w-64 h-64">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="#374151" strokeWidth="8" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white">{minutes}:{seconds}</div>
            <div className="text-sm text-gray-400 mt-1">{Math.round(progress * 100)}%</div>
            {sessionComplete && <div className="text-xs text-emerald-400 mt-2 animate-pulse">Session Complete! 🎉</div>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {running ? (
            <button onClick={pause} className="px-6 py-3 bg-orange-500 text-white rounded-xl">Pause</button>
          ) : (
            <button onClick={start} className="px-6 py-3 bg-indigo-500 text-white rounded-xl">Start</button>
          )}
          <button
            onClick={() => {
              reset();
              setSessionComplete(false);
              setInitialTime(mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60);
            }}
            className="px-6 py-3 bg-gray-700 text-white rounded-xl"
          >
            Reset
          </button>
        </div>

        {/* Custom Time */}
        <div className="text-center mb-4">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={running}
              className="px-4 py-2 bg-gray-700 text-white rounded-xl"
            >
              ⚙️ Custom Time
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                type="number"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="Minutes"
                className="px-2 py-1 rounded-lg bg-gray-800 text-white"
              />
              <button onClick={applyCustomTime} className="px-3 py-1 bg-indigo-500 text-white rounded-lg">Set</button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="text-center mb-4">
          <button onClick={() => setShowStats(!showStats)} className="px-4 py-2 bg-gray-700 text-white rounded-xl mb-4">
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>

          {showStats && (
            <div className="grid grid-cols-3 gap-4 justify-center">
              {[{ label: 'Work Time', value: workProgress, display: Math.floor(stats.workTime / 60) + 'm', color: '#6366F1' },
                { label: 'Break Time', value: breakProgress, display: Math.floor(stats.breakTime / 60) + 'm', color: '#10B981' },
                { label: 'Sessions', value: sessionProgress, display: stats.sessions.toString(), color: '#F59E0B' }].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#374151" strokeWidth="2" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={stat.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${stat.value * 100} ${100 - stat.value * 100}`}
                        style={{ transition: 'stroke-dasharray 0.5s' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold">{stat.display}</div>
                  </div>
                  <span className="text-xs text-gray-400">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
