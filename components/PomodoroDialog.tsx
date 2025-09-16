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
      // هنا يمكن إضافة صوت التنبيه
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
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const getModeConfig = () => {
    switch(mode) {
      case 'work':
        return {
          title: 'Work Session',
          color: '#00D4AA', // سايان يتماشى مع الموقع
          bgColor: 'from-slate-800 to-slate-900',
          glowColor: 'rgba(0, 212, 170, 0.3)',
          description: 'Focus time - Stay productive!',
          icon: '💼'
        };
      case 'shortBreak':
        return {
          title: 'Short Break',
          color: '#60A5FA', // أزرق فاتح
          bgColor: 'from-blue-900/50 to-slate-900',
          glowColor: 'rgba(96, 165, 250, 0.3)',
          description: 'Take a quick rest',
          icon: '☕'
        };
      case 'longBreak':
        return {
          title: 'Long Break',
          color: '#A78BFA', // بنفسجي
          bgColor: 'from-purple-900/50 to-slate-900',
          glowColor: 'rgba(167, 139, 250, 0.3)',
          description: 'Relax and recharge',
          icon: '🛋️'
        };
      default:
        return {
          title: 'Pomodoro',
          color: '#00D4AA',
          bgColor: 'from-slate-800 to-slate-900',
          glowColor: 'rgba(0, 212, 170, 0.3)',
          description: 'Get ready to focus',
          icon: '🍅'
        };
    }
  };

  const config = getModeConfig();

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) return; // منع التغيير أثناء التشغيل
    
    setMode(newMode);
    setSessionComplete(false);
    
    // تعيين الوقت الافتراضي للوضع الجديد لكن لا نبدأ العد التلقائياً
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

  // حساب نسبة الدائرة
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* خلفية مظلمة مع تأثير blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* المكون الرئيسي */}
      <div className={`relative z-10 bg-gradient-to-br ${config.bgColor} rounded-3xl shadow-2xl border border-slate-700/50 p-8 w-[420px]`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{config.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-white">{config.title}</h2>
              <p className="text-sm text-slate-400">{config.description}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* الدائرة الاحترافية */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* دائرة الخلفية */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="8"
                fill="none"
              />
              
              {/* دائرة التقدم مع التدرج */}
              <defs>
                <linearGradient id={`gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={config.color} stopOpacity="1" />
                  <stop offset="50%" stopColor={config.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={config.color} stopOpacity="0.6" />
                </linearGradient>
                <filter id={`glow-${mode}`}>
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke={`url(#gradient-${mode})`}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                filter={`url(#glow-${mode})`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* المحتوى الداخلي */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-mono font-bold text-white mb-1">
                {minutes}:{seconds}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                {Math.round(progress * 100)}% Complete
              </div>
              {sessionComplete && (
                <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Session Complete! 🎉
                </div>
              )}
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-center gap-4 mb-8">
          {running ? (
            <button 
              onClick={pause}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
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
              className={`px-8 py-3 font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${
                timeLeft === 0 
                  ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed' 
                  : `bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white`
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {timeLeft === 0 ? 'Complete' : 'Start'}
            </button>
          )}
          
          <button 
            onClick={() => {
              reset();
              setSessionComplete(false);
            }}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        {/* اختيار أنواع الجلسات */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: 'work', label: 'Work', time: '25m', icon: '💼' },
            { key: 'shortBreak', label: 'Short Break', time: '5m', icon: '☕' },
            { key: 'longBreak', label: 'Long Break', time: '15m', icon: '🛋️' }
          ].map((item) => (
            <button 
              key={item.key}
              onClick={() => handleModeChange(item.key as any)}
              disabled={running}
              className={`p-3 rounded-xl font-medium transition-all duration-200 border ${
                mode === item.key
                  ? `border-[${config.color}] bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-lg`
                  : `border-slate-600 bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 ${running ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}`
              }`}
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs opacity-75">{item.time}</div>
            </button>
          ))}
        </div>

        {/* الوقت المخصص */}
        <div className="text-center">
          {!showCustomInput ? (
            <button 
              onClick={() => setShowCustomInput(true)}
              disabled={running}
              className={`text-sm px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 transition-all duration-200 ${
                running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/30'
              }`}
            >
              ⚙️ Custom Time
            </button>
          ) : (
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1" 
                max="120"
                value={customTime} 
                onChange={(e) => setCustomTime(e.target.value)} 
                placeholder="Minutes"
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <button 
                onClick={applyCustomTime}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-200"
              >
                Set
              </button>
              <button 
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTime('');
                }}
                className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all duration-200"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* شريط التقدم السفلي */}
        <div className="mt-6">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r transition-all duration-1000 ease-out rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${config.color}80, ${config.color})`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
