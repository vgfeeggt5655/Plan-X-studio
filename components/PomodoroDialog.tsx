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
  completedPomodoros: number;
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
  const [stats, setStats] = useState<SessionStats>({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
    completedPomodoros: 0
  });
  const [showStats, setShowStats] = useState(false);
  const [workSessionsCount, setWorkSessionsCount] = useState(0);

  // مراقبة انتهاء الوقت والتبديل التلقائي
  useEffect(() => {
    if (timeLeft === 0 && !sessionComplete) {
      setSessionComplete(true);
      
      if (mode === 'work') {
        // تحديث الإحصائيات عند انتهاء جلسة العمل
        setStats(prev => ({
          ...prev,
          workTime: prev.workTime + initialTime,
          sessions: prev.sessions + 1,
          completedPomodoros: prev.completedPomodoros + 1
        }));
        
        // زيادة عداد جلسات العمل
        const newCount = workSessionsCount + 1;
        setWorkSessionsCount(newCount);
        
        // بعد 4 جلسات عمل، ننتقل إلى استراحة طويلة، وإلا استراحة قصيرة
        if (newCount % 4 === 0) {
          setTimeout(() => {
            setMode('longBreak');
            setTimeLeft(15 * 60);
            setInitialTime(15 * 60);
            setSessionComplete(false);
            start();
          }, 1500);
        } else {
          setTimeout(() => {
            setMode('shortBreak');
            setTimeLeft(5 * 60);
            setInitialTime(5 * 60);
            setSessionComplete(false);
            start();
          }, 1500);
        }
      } else {
        // تحديث الإحصائيات عند انتهاء جلسة الراحة
        setStats(prev => ({
          ...prev,
          breakTime: prev.breakTime + initialTime
        }));
        
        // العودة تلقائياً إلى وضع العمل بعد الراحة
        setTimeout(() => {
          setMode('work');
          setTimeLeft(25 * 60);
          setInitialTime(25 * 60);
          setSessionComplete(false);
          start();
        }, 1500);
      }
    }
  }, [timeLeft, sessionComplete, mode, initialTime, workSessionsCount, setMode, setTimeLeft, start]);

  // تأثير الإغلاق السلس
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
    switch(mode) {
      case 'work':
        return {
          title: 'Pomodoro',
          color: '#6366F1',
          secondaryColor: '#818CF8',
          bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(99, 102, 241, 0.5)',
          description: 'Focus & Work',
          ringColor: 'ring-indigo-500/30'
        };
      case 'shortBreak':
        return {
          title: 'Short Break',
          color: '#10B981',
          secondaryColor: '#34D399',
          bgGradient: 'from-emerald-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(16, 185, 129, 0.5)',
          description: 'Take a Break',
          ringColor: 'ring-emerald-500/30'
        };
      case 'longBreak':
        return {
          title: 'Long Break',
          color: '#8B5CF6',
          secondaryColor: '#A78BFA',
          bgGradient: 'from-purple-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(139, 92, 246, 0.5)',
          description: 'Long Rest',
          ringColor: 'ring-purple-500/30'
        };
      default:
        return {
          title: 'Pomodoro',
          color: '#6366F1',
          secondaryColor: '#818CF8',
          bgGradient: 'from-indigo-900/20 via-gray-900 to-gray-900',
          glowColor: 'rgba(99, 102, 241, 0.5)',
          description: 'Focus & Work',
          ringColor: 'ring-indigo-500/30'
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

  // حساب دائرة التقدم
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // دوائر الإحصائيات
  const totalWorkTime = stats.workTime;
  const totalBreakTime = stats.breakTime;
  const totalTimeTracked = totalWorkTime + totalBreakTime;
  const workPercentage = totalTimeTracked > 0 ? (totalWorkTime / totalTimeTracked) * 100 : 0;
  const breakPercentage = totalTimeTracked > 0 ? (totalBreakTime / totalTimeTracked) * 100 : 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-lg" onClick={handleClose}></div>
      
      <div className={`relative z-10 bg-gradient-to-br ${config.bgGradient} rounded-3xl shadow-2xl border border-gray-700/30 p-0 w-full max-w-md overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        
        {/* المحتوى الرئيسي */}
        <div className="p-8">
          
          {/* العنوان والوصف */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2" style={{ color: config.color }}>{config.title}</h2>
            <p className="text-gray-400 text-sm">{config.description}</p>
            {workSessionsCount > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Completed Pomodoros: {workSessionsCount}
              </div>
            )}
          </div>

          {/* الدائرة المحسنة */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              {/* دائرة الخلفية */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-700/20"></div>
              
              {/* دائرة التقدم */}
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
                  style={{
                    filter: `drop-shadow(0 0 8px ${config.glowColor})`
                  }}
                />
              </svg>
              
              {/* المحتوى الداخلي */}
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

          {/* أزرار التحكم */}
          <div className="flex justify-center gap-4 mb-6">
            {running ? (
              <button 
                onClick={pause}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
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
                {timeLeft === 0 ? 'Done' : 'Start'}
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

          {/* الوقت المخصص بتصميم شبيه بـ iOS */}
          <div className="text-center mb-4">
            {!showCustomInput ? (
              <button 
                onClick={() => setShowCustomInput(true)}
                disabled={running}
                className={`text-sm px-6 py-2 rounded-xl bg-gray-700/40 text-gray-300 transition-all duration-200 font-medium ${
                  running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                ⚙️ Custom Time
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg flex items-center"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* زر عرض الإحصائيات */}
          <div className="text-center">
            <button 
              onClick={() => setShowStats(!showStats)}
              className="text-sm px-6 py-2 rounded-xl bg-gray-700/40 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 font-medium flex items-center justify-center gap-2 mx-auto"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
              <svg className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* قسم الإحصائيات */}
          {showStats && (
            <div className="mt-6 bg-gray-800/40 p-4 rounded-2xl border border-gray-700/30">
              <h3 className="text-white font-medium mb-4 text-center">Session Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* دائرة إحصائيات وقت العمل */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#374151" strokeWidth="2"/>
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"
                        strokeDasharray={`${workPercentage} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{Math.floor(totalWorkTime / 60)}m</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Focus Time</span>
                </div>
                
                {/* دائرة إحصائيات وقت الراحة */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#374151" strokeWidth="2"/>
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"
                        strokeDasharray={`${breakPercentage} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{Math.floor(totalBreakTime / 60)}m</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Break Time</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-3 bg-gray-700/30 rounded-xl">
                  <span className="text-white font-bold text-lg">{stats.completedPomodoros}</span>
                  <span className="text-xs text-gray-400">Pomodoros</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-700/30 rounded-xl">
                  <span className="text-white font-bold text-lg">{stats.sessions}</span>
                  <span className="text-xs text-gray-400">Sessions</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Focus Time:</span>
                  <span className="text-white font-medium">{Math.floor(totalWorkTime / 60)}m {totalWorkTime % 60}s</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">Total Break Time:</span>
                  <span className="text-white font-medium">{Math.floor(totalBreakTime / 60)}m {totalBreakTime % 60}s</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">Focus/Break Ratio:</span>
                  <span className="text-white font-medium">
                    {totalBreakTime > 0 ? (totalWorkTime / totalBreakTime).toFixed(1) : '∞'} : 1
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* التابات السفلية المحسنة */}
        <div className="px-6 pb-6 pt-0">
          <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1">
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

        {/* زر الإغلاق */}
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
