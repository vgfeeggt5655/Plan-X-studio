import React, { useState, useEffect } from 'react';

interface PomodoroDialogProps {
  open: boolean;
  onClose: () => void;
  pomodoroMode: 'work' | 'shortBreak' | 'longBreak';
  pomodoroTimeLeft: number;
  pomodoroRunning: boolean;
  setPomodoroRunning: (running: boolean) => void;
  setPomodoroMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  setPomodoroTimeLeft: (time: number) => void;
  pomodoroCount: number;
  setPomodoroCount: (count: number) => void;
}

const PomodoroDialog: React.FC<PomodoroDialogProps> = ({
  open,
  onClose,
  pomodoroMode,
  pomodoroTimeLeft,
  pomodoroRunning,
  setPomodoroRunning,
  setPomodoroMode,
  setPomodoroTimeLeft,
  pomodoroCount,
  setPomodoroCount,
}) => {
  const [customTimes, setCustomTimes] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  if (!open) return null;

  const minutes = Math.floor(pomodoroTimeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (pomodoroTimeLeft % 60).toString().padStart(2, '0');

  const handleModeChange = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setPomodoroMode(mode);
    setPomodoroTimeLeft(customTimes[mode] * 60);
    setPomodoroRunning(false);
  };

  const handleReset = () => {
    setPomodoroTimeLeft(customTimes[pomodoroMode] * 60);
    setPomodoroRunning(false);
  };

  const handleTimeChange = (mode: 'work' | 'shortBreak' | 'longBreak', value: number) => {
    setCustomTimes(prev => ({ ...prev, [mode]: value }));
    if (pomodoroMode === mode) setPomodoroTimeLeft(value * 60);
  };

  const progress = 1 - pomodoroTimeLeft / (customTimes[pomodoroMode] * 60);

  const getColor = () => {
    switch (pomodoroMode) {
      case 'work': return 'bg-red-500';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-96 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
        >✕</button>

        <h2 className="text-xl font-bold mb-4 text-center">
          {pomodoroMode === 'work' ? 'وقت العمل' : pomodoroMode === 'shortBreak' ? 'استراحة قصيرة' : 'استراحة طويلة'}
        </h2>

        {/* عداد دائري */}
        <div className="w-40 h-40 mx-auto relative mb-4">
          <svg className="w-full h-full rotate-180">
            <circle
              cx="50%" cy="50%" r="70"
              stroke="#ddd" strokeWidth="8" fill="none"
            />
            <circle
              cx="50%" cy="50%" r="70"
              stroke={getColor()} strokeWidth="8" fill="none"
              strokeDasharray={440} strokeDashoffset={440 * (1 - progress)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-mono">
            {minutes}:{seconds}
          </div>
        </div>

        {/* أزرار التشغيل / إعادة الضبط */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setPomodoroRunning(!pomodoroRunning)}
            className={`px-4 py-2 rounded-md text-white font-semibold ${pomodoroRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {pomodoroRunning ? 'إيقاف' : 'تشغيل'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 font-semibold"
          >
            إعادة ضبط
          </button>
        </div>

        {/* اختيار الوضع ووقت مخصص */}
        <div className="flex justify-between gap-2 mb-2">
          {(['work', 'shortBreak', 'longBreak'] as const).map(mode => (
            <div key={mode} className="flex flex-col items-center">
              <button
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1 rounded-md font-medium ${pomodoroMode === mode ? getColor() + ' text-white' : 'bg-gray-200'}`}
              >
                {mode === 'work' ? 'عمل' : mode === 'shortBreak' ? 'استراحة قصيرة' : 'استراحة طويلة'}
              </button>
              <input
                type="number"
                value={customTimes[mode]}
                min={1} max={120}
                onChange={e => handleTimeChange(mode, Number(e.target.value))}
                className="w-16 text-center mt-1 border border-gray-300 rounded-md"
              />
            </div>
          ))}
        </div>

        {/* جلسات Pomodoro */}
        <div className="text-center mt-2 text-gray-700">
          جلسات مكتملة: {pomodoroCount}
        </div>
      </div>
    </div>
  );
};

export default PomodoroDialog;
