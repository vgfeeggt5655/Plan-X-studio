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
  const [customTime, setCustomTime] = useState(25);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (timeLeft === 0 && !sessionComplete) setSessionComplete(true);
  }, [timeLeft, sessionComplete]);

  if (!open) return null;

  const getTotalTime = () => {
    switch (mode) {
      case 'work': return 25 * 60;
      case 'shortBreak': return 5 * 60;
      case 'longBreak': return 15 * 60;
      default: return 25 * 60;
    }
  };

  const totalTime = getTotalTime();
  const progress = totalTime > 0 ? (timeLeft / totalTime) : 0;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const config = {
    work: { title: 'Pomodoro', color: '#38bdf8', description: 'Focus & Work' },
    shortBreak: { title: 'Short Break', color: '#22d3ee', description: 'Take a Break' },
    longBreak: { title: 'Long Break', color: '#3b82f6', description: 'Long Rest' },
  }[mode];

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={onClose}></div>

      <div className="relative z-10 bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 
                      rounded-3xl shadow-2xl border border-sky-700/30 p-8 w-[420px]">
        
        {/* Tabs */}
        <div className="flex bg-slate-800/50 rounded-2xl overflow-hidden mb-6">
          {[
            { key: 'work', label: 'Pomodoro' },
            { key: 'shortBreak', label: 'Short Break' },
            { key: 'longBreak', label: 'Long Break' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !running && setMode(tab.key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 
                ${mode === tab.key
                  ? 'text-white bg-sky-700'
                  : `text-slate-400 hover:text-white ${running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/30'}`
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* العنوان */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-sky-300">{config.title}</h2>
          <p className="text-slate-400 text-sm">{config.description}</p>
        </div>

        {/* دائرة جديدة */}
        <div className="flex justify-center mb-6">
          <div className="relative w-56 h-56">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                fill="none"
                stroke={config.color}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-mono font-bold text-white">{minutes}:{seconds}</div>
              <div className="text-sm text-slate-400">{Math.round(progress * 100)}%</div>
              {running && (
                <div className="text-xs text-slate-400 mt-1 animate-pulse">
                  {mode === 'work' ? 'FOCUS' : 'RELAX'}
                </div>
              )}
              {sessionComplete && (
                <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce text-xs">
                  Complete 🎉
                </div>
              )}
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex justify-center gap-4 mb-6">
          {running ? (
            <button
              onClick={pause}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={start}
              disabled={timeLeft === 0}
              className={`px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold
                          ${timeLeft === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {timeLeft === 0 ? 'Done' : 'Start'}
            </button>
          )}
          <button
            onClick={() => { reset(); setSessionComplete(false); }}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-2xl font-bold"
          >
            Reset
          </button>
        </div>

        {/* slider لاختيار الوقت */}
        <div className="text-center space-y-2">
          <input
            type="range"
            min="1"
            max="120"
            value={customTime}
            onChange={(e) => setCustomTime(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="text-slate-300">⏱ {customTime} min</div>
          <button
            onClick={() => { setTimeLeft(customTime * 60); setSessionComplete(false); }}
            className="mt-2 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium"
          >
            Set Custom Time
          </button>
        </div>

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/70 flex items-center justify-center text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
