import React, { useState, useEffect, useRef, useCallback } from 'react';

// أنواع TypeScript
interface SessionStats {
  workTime: number;
  breakTime: number;
  sessions: number;
  totalTime: number;
}

interface TimerMode {
  title: string;
  color: string;
  secondaryColor: string;
  bgGradient: string;
  glowColor: string;
  description: string;
  ringColor: string;
  defaultTime: number;
}

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

// تعريف الأوضاع
const timerModes: Record<'work' | 'shortBreak' | 'longBreak', TimerMode> = {
  work: {
    title: 'Work',
    color: 'text-indigo-600',
    secondaryColor: 'text-indigo-400',
    bgGradient: 'from-indigo-500 to-purple-500',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    description: 'Focus on your task',
    ringColor: '#4f46e5',
    defaultTime: 25 * 60
  },
  shortBreak: {
    title: 'Short Break',
    color: 'text-emerald-600',
    secondaryColor: 'text-emerald-400',
    bgGradient: 'from-emerald-400 to-emerald-600',
    glowColor: 'rgba(5, 150, 105, 0.5)',
    description: 'Take a short break',
    ringColor: '#059669',
    defaultTime: 5 * 60
  },
  longBreak: {
    title: 'Long Break',
    color: 'text-purple-600',
    secondaryColor: 'text-purple-400',
    bgGradient: 'from-purple-500 to-indigo-700',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'Take a longer break',
    ringColor: '#7c3aed',
    defaultTime: 15 * 60
  }
};

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
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
    totalTime: 0
  });
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [completedSession, setCompletedSession] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const dialogRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // طلب إذن الإشعارات
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission('granted');
      }
    }
  }, []);

  // إنشاء عنصر الصوت
  useEffect(() => {
    // إنشاء صوت بسيط باستخدام Base64 (نغمة بسيطة)
    audioRef.current = new Audio("data:audio/wav;base64,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");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // إغلاق الـ dialog عند النقر خارج المحتوى
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // إدارة المؤقت
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (running && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && running) {
      // عند انتهاء الوقت
      if (audioRef.current) {
        audioRef.current.play();
      }

      // إشعار عند انتهاء الجلسة
      if (notificationPermission === 'granted') {
        new Notification(`Pomodoro Timer - ${timerModes[mode].title} Finished`, {
          body: mode === 'work' ? 'Time for a break!' : 'Time to get back to work!',
          icon: '/favicon.ico'
        });
      }

      // تحديث الإحصائيات
      if (mode === 'work') {
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        
        setSessionStats(prev => ({
          ...prev,
          workTime: prev.workTime + timerModes.work.defaultTime,
          sessions: prev.sessions + 1,
          totalTime: prev.totalTime + timerModes.work.defaultTime
        }));
        setCompletedSession(true);
        setTimeout(() => setCompletedSession(false), 3000);

        // التبديل التلقائي بين أوضاع الراحة
        if (newSessionCount % 4 === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else {
        setSessionStats(prev => ({
          ...prev,
          breakTime: prev.breakTime + timerModes[mode].defaultTime,
          totalTime: prev.totalTime + timerModes[mode].defaultTime
        }));
        setMode('work');
      }

      pause();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, timeLeft, mode, setMode, pause, setTimeLeft, sessionStats, notificationPermission, sessionCount]);

  // إعادة التعيين عند الإغلاق
  useEffect(() => {
    if (!open) {
      pause();
      setShowCustomTime(false);
      setShowStats(false);
    }
  }, [open, pause]);

  // تنسيق الوقت
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // حساب النسبة المئوية للتقدم
  const progressPercentage = useCallback(() => {
    const totalTime = timerModes[mode].defaultTime;
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, [timeLeft, mode]);

  // تطبيق الوقت المخصص
  const handleCustomTimeSubmit = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes >= 1 && minutes <= 180) {
      setTimeLeft(minutes * 60);
      setShowCustomTime(false);
      setCustomMinutes('');
    }
  };

  // إعادة تعيين الإحصائيات
  const resetStats = () => {
    setSessionStats({
      workTime: 0,
      breakTime: 0,
      sessions: 0,
      totalTime: 0
    });
    setSessionCount(0);
  };

  // إعادة تعيين المؤقت
  const handleReset = () => {
    reset();
    setTimeLeft(timerModes[mode].defaultTime);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div 
        ref={dialogRef}
        className={`relative bg-white rounded-2xl shadow-xl transform transition-all duration-300 scale-100 opacity-100 w-full max-w-md mx-4 p-6 ${showStats ? 'h-5/6' : 'h-auto'}`}
        style={{
          boxShadow: `0 0 25px 5px ${timerModes[mode].glowColor}`
        }}
      >
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showStats ? (
          // عرض الإحصائيات
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-center mb-6">Session Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Work Time</p>
                <p className="text-2xl">{formatTime(sessionStats.workTime)}</p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Break Time</p>
                <p className="text-2xl">{formatTime(sessionStats.breakTime)}</p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Sessions</p>
                <p className="text-2xl">{sessionStats.sessions}</p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Total Time</p>
                <p className="text-2xl">{formatTime(sessionStats.totalTime)}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-lg font-semibold mb-2">Work/Break Ratio</p>
              <div className="w-full bg-gray-300 rounded-full h-4">
                <div 
                  className="bg-indigo-600 h-4 rounded-full" 
                  style={{ width: `${sessionStats.totalTime > 0 ? (sessionStats.workTime / sessionStats.totalTime) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-center mt-2">
                {sessionStats.totalTime > 0 ? Math.round((sessionStats.workTime / sessionStats.totalTime) * 100) : 0}% Work
              </p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-lg font-semibold">Average Session</p>
              <p className="text-xl text-center">
                {sessionStats.sessions > 0 ? formatTime(sessionStats.workTime / sessionStats.sessions) : '0:00'}
              </p>
            </div>
            
            <div className="mt-auto flex justify-between">
              <button
                onClick={() => setShowStats(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Timer
              </button>
              <button
                onClick={resetStats}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reset Stats
              </button>
            </div>
          </div>
        ) : (
          // عرض المؤقت
          <>
            {/* تبويبات الأوضاع */}
            <div className="flex justify-center mb-6">
              {(['work', 'shortBreak', 'longBreak'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setTimeLeft(timerModes[m].defaultTime);
                    if (running) pause();
                  }}
                  className={`mx-1 px-4 py-2 rounded-lg transition-colors ${mode === m 
                    ? `bg-${timerModes[m].color.split('-')[1]}-100 ${timerModes[m].color} font-semibold` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {m === 'work' ? 'Work 🍅' : m === 'shortBreak' ? 'Short Break ☕' : 'Long Break 🛋️'}
                </button>
              ))}
            </div>

            {/* دائرة التقدم */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* الخلفية */}
                <circle
                  className="text-gray-200 stroke-current"
                  strokeWidth="8"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
                {/* التقدم */}
                <circle
                  className={`stroke-current ${timerModes[mode].color}`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (progressPercentage() * 251.2) / 100}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              {/* الوقت المتبقي */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-4xl font-bold ${timerModes[mode].color}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-sm ${timerModes[mode].secondaryColor}`}>
                  {timerModes[mode].description}
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex justify-center space-x-4 mb-6">
              {running ? (
                <button
                  onClick={pause}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </button>
              ) : (
                <button
                  onClick={start}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start
                </button>
              )}
              
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </button>
            </div>

            {/* الأزرار الإضافية */}
            <div className="flex justify-between">
              <button
                onClick={() => setShowCustomTime(!showCustomTime)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Custom Time
              </button>
              
              <button
                onClick={() => setShowStats(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                View Stats
              </button>
            </div>

            {/* إدخال الوقت المخصص */}
            {showCustomTime && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="mb-2 font-semibold">Set custom time (minutes):</p>
                <div className="flex">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1-180"
                  />
                  <button
                    onClick={handleCustomTimeSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}

            {/* شارة النجاح */}
            {completedSession && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center animate-pulse">
                🎉 Great job! Session completed! 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
