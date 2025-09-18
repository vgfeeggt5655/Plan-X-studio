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
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [initialTime, setInitialTime] = useState(timeLeft);

  useEffect(() => {
    setInitialTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) {
      pause();
      setSessionComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, running, pause]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!open && !isClosing) return null;

  const totalTime = initialTime;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return {
          title: 'Pomodoro',
          color: '#6366F1',
          secondaryColor: '#818CF8',
          bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(99, 102, 241, 0.5)',
          description: 'Focus & Work',
          buttonColor: 'bg-indigo-600',
          buttonHover: 'hover:bg-indigo-700'
        };
      case 'shortBreak':
        return {
          title: 'Short Break',
          color: '#10B981',
          secondaryColor: '#34D399',
          bgGradient: 'from-emerald-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(16, 185, 129, 0.5)',
          description: 'Take a Break',
          buttonColor: 'bg-emerald-600',
          buttonHover: 'hover:bg-emerald-700'
        };
      case 'longBreak':
        return {
          title: 'Long Break',
          color: '#8B5CF6',
          secondaryColor: '#A78BFA',
          bgGradient: 'from-purple-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(139, 92, 246, 0.5)',
          description: 'Long Rest',
          buttonColor: 'bg-purple-600',
          buttonHover: 'hover:bg-purple-700'
        };
      default:
        return {
          title: 'Pomodoro',
          color: '#6366F1',
          secondaryColor: '#818CF8',
          bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(99, 102, 241, 0.5)',
          description: 'Focus & Work',
          buttonColor: 'bg-indigo-600',
          buttonHover: 'hover:bg-indigo-700'
        };
    }
  };

  const config = getModeConfig();

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) return;

    setMode(newMode);
    setSessionComplete(false);

    switch (newMode) {
      case 'work':
        setTimeLeft(25 * 60);
        setInitialTime(25 * 60);
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60);
        setInitialTime(5 * 60);
        break;
      case 'longBreak':
        setTimeLeft(15 * 60);
        setInitialTime(15 * 60);
        break;
    }
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-lg" onClick={handleClose}></div>

      <div className={`relative z-10 bg-gradient-to-br ${config.bgGradient} rounded-3xl shadow-2xl border border-gray-700/30 p-0 w-full max-w-md overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex bg-gray-700/30 rounded-2xl p-1 w-full max-w-sm">
            {[
              { key: 'work', label: 'Pomodoro' },
              { key: 'shortBreak', label: 'Short Break' },
              { key: 'longBreak', label: 'Long Break' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleModeChange(tab.key as any)}
                disabled={running}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative rounded-xl ${
                  mode === tab.key
                    ? 'text-white bg-gray-600/40 shadow-md'
                    : `text-gray-400 ${running ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 pt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2" style={{ color: config.color }}>{config.title}</h2>
            <p className="text-gray-400 text-sm">{config.description}</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              {/* This is the new, fancy progress circle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id={`progress-gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={config.color} />
                    <stop offset="100%" stopColor={config.secondaryColor} />
                  </linearGradient>
                </defs>
                {/* The background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                />
                {/* The progress circle */}
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
                  style={{
                    filter: `drop-shadow(0 0 8px ${config.glowColor})`
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono font-bold text-white mb-2">
                  {minutes}:{seconds}
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  {Math.round(progress * 100)}% Complete
                </div>
                {running && (
                  <div className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/30 uppercase tracking-widest mt-2">
                    {mode === 'work' ? 'FOCUS TIME' : 'BREAK TIME'}
                  </div>
                )}
                {sessionComplete && (
                  <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse mt-2">
                    Session Complete! 🎉
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            {running ? (
              <button
                onClick={pause}
                className={`px-8 py-3 ${config.buttonColor} ${config.buttonHover} text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </button>
            ) : (
              <button
                onClick={start}
                disabled={timeLeft === 0}
                className={`px-8 py-3 font-bold rounded-xl shadow-lg transform transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center ${
                  timeLeft === 0
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'hover:scale-105 text-white'
                }`}
                style={timeLeft > 0 ? {
                  background: `linear-gradient(135deg, ${config.color}, ${config.secondaryColor})`
                } : {}}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Start
              </button>
            )}

            <button
              onClick={() => {
                reset();
                setSessionComplete(false);
                setInitialTime(mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60);
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          <div className="text-center mb-4">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                disabled={running}
                className={`text-sm px-6 py-2 rounded-xl bg-gray-700/40 text-gray-300 transition-all duration-200 font-medium ${
                  running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.941 3.31 0 4.343 1.543a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.941 1.543 0 3.31-1.543 4.343a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.941-3.31 0-4.343-1.543a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.941-1.543 0-3.31 1.543-4.343a1.724 1.724 0 002.573-1.066z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Custom Time
              </button>
            ) : (
              <div className="bg-gray-800/70 p-4 rounded-2xl border border-gray-700/30 mx-auto max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">Set Custom Time</h3>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTime('');
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Minutes (1-120)"
                    className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 font-medium"
                  />
                  <button
                    onClick={applyCustomTime}
                    className={`px-4 py-2 ${config.buttonColor} ${config.buttonHover} text-white rounded-xl font-medium transition-all duration-200 shadow-lg flex items-center`}
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/70 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
