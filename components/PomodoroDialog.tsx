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

  // مراقبة انتهاء الوقت
  useEffect(() => {
    if (timeLeft === 0 && !sessionComplete) {
      setSessionComplete(true);
    }
  }, [timeLeft, sessionComplete]);

  if (!open) return null;

  const getTotalTime = () => {
    switch(mode) {
      case 'work': return 25 * 60;
      case 'shortBreak': return 5 * 60;
      case 'longBreak': return 15 * 60;
      default: return 25 * 60;
    }
  };

  const totalTime = getTotalTime();
  // تغيير حساب التقدم - الدائرة تبدأ كاملة وتقل
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const getModeConfig = () => {
    switch(mode) {
      case 'work':
        return {
          title: 'pomodoro',
          color: '#FF6B6B', // أحمر كورال
          bgGradient: 'from-red-900/30 via-slate-900 to-slate-900',
          glowColor: 'rgba(255, 107, 107, 0.4)',
          description: 'Focus & Work',
        };
      case 'shortBreak':
        return {
          title: 'short break',
          color: '#4ECDC4', // تيل/سايان
          bgGradient: 'from-teal-900/30 via-slate-900 to-slate-900',
          glowColor: 'rgba(78, 205, 196, 0.4)',
          description: 'Take a Break',
        };
      case 'longBreak':
        return {
          title: 'long break',
          color: '#45B7D1', // أزرق
          bgGradient: 'from-blue-900/30 via-slate-900 to-slate-900',
          glowColor: 'rgba(69, 183, 209, 0.4)',
          description: 'Long Rest',
        };
      default:
        return {
          title: 'pomodoro',
          color: '#FF6B6B',
          bgGradient: 'from-red-900/30 via-slate-900 to-slate-900',
          glowColor: 'rgba(255, 107, 107, 0.4)',
          description: 'Focus & Work',
        };
    }
  };

  const config = getModeConfig();

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) return;
    
    setMode(newMode);
    setSessionComplete(false);
    
    switch(newMode) {
      case 'work':
        setTimeLeft(25 * 60);
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60);
        break;
      case 'longBreak':
        setTimeLeft(15 * 60);
        break;
    }
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if (!isNaN(minutesNum) && minutesNum > 0 && minutesNum <= 120) {
      setTimeLeft(minutesNum * 60);
      setCustomTime('');
      setShowCustomInput(false);
      setSessionComplete(false);
    }
  };

  // حساب نسبة الدائرة - الدائرة تبدأ كاملة وتقل
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // عكس الحساب عشان الدائرة تبدأ كاملة وتقل
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose}></div>
      
      <div className={`relative z-10 bg-gradient-to-br ${config.bgGradient} rounded-3xl shadow-2xl border border-slate-700/30 p-0 w-[400px] min-h-[500px] overflow-hidden`}>
        
        {/* التابات العلوية */}
        <div className="flex bg-slate-800/50 backdrop-blur-sm">
          {[
            { key: 'work', label: 'pomodoro' },
            { key: 'shortBreak', label: 'short break' },
            { key: 'longBreak', label: 'long break' }
          ].map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => handleModeChange(tab.key as any)}
              disabled={running}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                mode === tab.key
                  ? 'text-white bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg'
                  : `text-slate-400 hover:text-white ${running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/30'}`
              } ${index === 0 ? 'rounded-tl-3xl' : ''} ${index === 2 ? 'rounded-tr-3xl' : ''}`}
            >
              {tab.label}
              {mode === tab.key && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                ></div>
              )}
            </button>
          ))}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="p-8">
          
          {/* العنوان والوصف */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 capitalize">{config.title}</h2>
            <p className="text-slate-400 text-sm">{config.description}</p>
          </div>

          {/* الدائرة المحسنة */}
          <div className="flex justify-center mb-8">
            <div className="relative w-56 h-56">
              {/* دائرة الخلفية */}
              <div className="absolute inset-0 rounded-full border-8 border-slate-600/20"></div>
              
              {/* دائرة التقدم */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id={`progress-gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={config.color} />
                    <stop offset="100%" stopColor={config.color} stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  fill="none"
                  stroke={`url(#progress-gradient-${mode})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 283} 283`}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 10px ${config.color}40)`
                  }}
                />
              </svg>
              
              {/* المحتوى الداخلي */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono font-bold text-white mb-2">
                  {minutes}:{seconds}
                </div>
                <div className="text-sm text-slate-400 mb-1">
                  {Math.round(progress * 100)}%
                </div>
                {running && (
                  <div className="text-xs text-slate-400 uppercase tracking-widest animate-pulse">
                    {mode === 'work' ? 'FOCUS' : 'RELAX'}
                  </div>
                )}
                {sessionComplete && (
                  <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce">
                    Complete! 🎉
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-center gap-4 mb-6">
            {running ? (
              <button 
                onClick={pause}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[120px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                PAUSE
              </button>
            ) : (
              <button 
                onClick={start}
                disabled={timeLeft === 0}
                className={`px-8 py-3 font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[120px] ${
                  timeLeft === 0 
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                    : 'text-white hover:shadow-2xl'
                }`}
                style={timeLeft > 0 ? {
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`
                } : {}}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {timeLeft === 0 ? 'DONE' : 'START'}
              </button>
            )}
            
            <button 
              onClick={() => {
                reset();
                setSessionComplete(false);
              }}
              className="px-6 py-3 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              RESET
            </button>
          </div>

          {/* الوقت المخصص */}
          <div className="text-center">
            {!showCustomInput ? (
              <button 
                onClick={() => setShowCustomInput(true)}
                disabled={running}
                className={`text-sm px-6 py-2 rounded-xl border border-slate-500/50 text-slate-300 transition-all duration-200 font-medium ${
                  running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/30 hover:border-slate-400'
                }`}
              >
                ⚙️ Custom Timer
              </button>
            ) : (
              <div className="flex gap-2 max-w-xs mx-auto">
                <input 
                  type="number" 
                  min="1" 
                  max="120"
                  value={customTime} 
                  onChange={(e) => setCustomTime(e.target.value)} 
                  placeholder="Minutes"
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-500 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 font-medium"
                />
                <button 
                  onClick={applyCustomTime}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
                >
                  Set
                </button>
                <button 
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTime('');
                  }}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* زر الإغلاق */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/70 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 z-10"
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
