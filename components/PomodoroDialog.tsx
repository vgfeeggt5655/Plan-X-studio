import React, { useState, useEffect } from 'react';
// import { PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'; // يمكنك استخدام مكتبات أيقونات

interface PomodoroDialogProps {
  open: boolean;
  onClose: () => void;
  timeLeft: number; // بالثواني
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  mode: 'work' | 'shortBreak' | 'longBreak';
  setMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  setTimeLeft: (time: number) => void;
}

const PomodoroDialog: React.FC<PomodoroDialogProps> = ({
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
  const [showSettings, setShowSettings] = useState(false);
  const [workTime, setWorkTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);

  useEffect(() => {
    // تحديث الوقت عند تغيير الوضع
    if (mode === 'work') setTimeLeft(workTime * 60);
    if (mode === 'shortBreak') setTimeLeft(shortBreakTime * 60);
    if (mode === 'longBreak') setTimeLeft(longBreakTime * 60);
  }, [mode, workTime, shortBreakTime, longBreakTime, setTimeLeft]);

  if (!open) return null;

  const totalTime = mode === 'work' ? workTime * 60 : mode === 'shortBreak' ? shortBreakTime * 60 : longBreakTime * 60;
  const progress = 1 - (timeLeft / totalTime);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (running) {
      pause();
    }
    setMode(newMode);
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if (!isNaN(minutesNum) && minutesNum > 0) {
      setTimeLeft(minutesNum * 60);
      setCustomTime('');
    }
  };

  const applySettings = () => {
    // يمكنك إضافة منطق للتأكد من أن الأرقام صالحة
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-80 max-w-sm flex flex-col items-center gap-6 relative transition-transform duration-300 scale-95 opacity-0 animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pomodoro</h2>

        {/* أزرار اختيار الوضع */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-full gap-1">
          <button
            onClick={() => handleModeChange('work')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'work' ? 'bg-blue-500 text-white shadow' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Work
          </button>
          <button
            onClick={() => handleModeChange('shortBreak')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'shortBreak' ? 'bg-emerald-500 text-white shadow' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Short Break
          </button>
          <button
            onClick={() => handleModeChange('longBreak')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'longBreak' ? 'bg-purple-500 text-white shadow' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Long Break
          </button>
        </div>

        {/* الدائرة التقدمية */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%" cy="50%" r="45%"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="10"
              fill="none"
              stroke="currentColor"
            />
            <circle
              cx="50%" cy="50%" r="45%"
              className={`transition-colors duration-500 ${mode === 'work' ? 'text-blue-500' : mode === 'shortBreak' ? 'text-emerald-500' : 'text-purple-500'}`}
              strokeWidth="10"
              fill="none"
              stroke="currentColor"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * progress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-mono font-bold text-gray-800 dark:text-gray-100">{minutes}:{seconds}</div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-4">
          {running ?
            <button onClick={pause} className="p-4 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            :
            <button onClick={start} className="p-4 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.26a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
            </button>
          }
          <button onClick={reset} className="p-4 rounded-full bg-gray-200 text-gray-600 shadow-lg hover:bg-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.96 8.96 0 0115 21v-2a6.974 6.974 0 00-6.944-6.944l-2.432-.243m-2.432-.243a7 7 0 0112.593-4.495m3.666 4.495h-5.918" /></svg>
          </button>
        </div>

        {/* زر الإعدادات */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute bottom-4 left-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.941 3.31 1.35 1.761 2.753a1.724 1.724 0 00.043 2.575c1.543.941-2.464 2.753-1.761 2.753a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.941-3.31-1.35-1.761-2.753a1.724 1.724 0 00-.043-2.575c-1.543-.941 2.464-2.753 1.761-2.753a1.724 1.724 0 002.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        {/* قسم الإعدادات (يظهر عند النقر) */}
        {showSettings && (
          <div className="mt-4 w-full text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Customize Times (minutes)</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                Work:
                <input
                  type="number"
                  min={1}
                  value={workTime}
                  onChange={(e) => setWorkTime(parseInt(e.target.value))}
                  className="w-16 p-1 rounded border border-gray-300 dark:border-gray-600 text-center"
                />
              </label>
              <label className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                Short Break:
                <input
                  type="number"
                  min={1}
                  value={shortBreakTime}
                  onChange={(e) => setShortBreakTime(parseInt(e.target.value))}
                  className="w-16 p-1 rounded border border-gray-300 dark:border-gray-600 text-center"
                />
              </label>
              <label className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                Long Break:
                <input
                  type="number"
                  min={1}
                  value={longBreakTime}
                  onChange={(e) => setLongBreakTime(parseInt(e.target.value))}
                  className="w-16 p-1 rounded border border-gray-300 dark:border-gray-600 text-center"
                />
              </label>
            </div>
            <button
              onClick={applySettings}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroDialog;
