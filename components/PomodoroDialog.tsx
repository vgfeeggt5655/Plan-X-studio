import React, { useState, useEffect } from 'react';

interface PomodoroDialogProps {
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
  const [volume, setVolume] = useState(50);
  const [showSettings, setShowSettings] = useState(false);

  if (!open) return null;

  const totalTime = mode === 'work' ? 25*60 : mode === 'shortBreak' ? 5*60 : 15*60;
  const progress = 1 - timeLeft / totalTime;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2,'0');
  const seconds = (timeLeft % 60).toString().padStart(2,'0');

  // تحديد الألوان حسب الوضع
  const getModeColors = () => {
    switch(mode) {
      case 'work':
        return {
          primary: '#ef4444', // أحمر للعمل
          secondary: '#fca5a5',
          bg: 'from-red-50 to-red-100',
          gradient: 'from-red-500 to-red-600'
        };
      case 'shortBreak':
        return {
          primary: '#10b981', // أخضر للاستراحة القصيرة
          secondary: '#86efac',
          bg: 'from-green-50 to-green-100',
          gradient: 'from-green-500 to-green-600'
        };
      case 'longBreak':
        return {
          primary: '#3b82f6', // أزرق للاستراحة الطويلة
          secondary: '#93c5fd',
          bg: 'from-blue-50 to-blue-100',
          gradient: 'from-blue-500 to-blue-600'
        };
      default:
        return {
          primary: '#6b7280',
          secondary: '#d1d5db',
          bg: 'from-gray-50 to-gray-100',
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const colors = getModeColors();

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    if(newMode === 'work') setTimeLeft(25*60);
    if(newMode === 'shortBreak') setTimeLeft(5*60);
    if(newMode === 'longBreak') setTimeLeft(15*60);
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if(!isNaN(minutesNum) && minutesNum > 0){
      setTimeLeft(minutesNum * 60);
      setCustomTime('');
    }
  };

  // حساب نسبة التقدم للدائرة
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-8 w-96 shadow-2xl relative border border-white/20`}>
        
        {/* زر الإغلاق */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
        >
          ✕
        </button>

        {/* زر الإعدادات */}
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
        >
          ⚙️
        </button>

        {/* العنوان */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Pomodoro Timer</h2>
          <p className="text-sm text-gray-600 capitalize">{mode.replace(/([A-Z])/g, ' $1').trim()} Session</p>
        </div>

        {/* الدائرة المحسنة */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90 drop-shadow-lg">
            {/* دائرة الخلفية */}
            <circle
              cx="50%" 
              cy="50%" 
              r="70"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
              className="opacity-30"
            />
            {/* دائرة التقدم */}
            <circle
              cx="50%" 
              cy="50%" 
              r="70"
              stroke={colors.primary}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-in-out"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))'
              }}
            />
          </svg>
          
          {/* العدد الزمني */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-mono font-bold text-gray-800 mb-1">
              {minutes}:{seconds}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {Math.round(progress * 100)}% Complete
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-center gap-4 mb-6">
          {running ? (
            <button 
              onClick={pause} 
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl text-white font-semibold hover:from-amber-500 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
            >
              ⏸️ Pause
            </button>
          ) : (
            <button 
              onClick={start} 
              className={`px-6 py-3 bg-gradient-to-r ${colors.gradient} rounded-xl text-white font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg flex items-center gap-2`}
            >
              ▶️ Start
            </button>
          )}
          <button 
            onClick={reset} 
            className="px-6 py-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl text-white font-semibold hover:from-slate-500 hover:to-slate-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
          >
            🔄 Reset
          </button>
        </div>

        {/* اختيار نوع الجلسة */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'work', label: 'Work', icon: '💼', time: '25 min' },
            { key: 'shortBreak', label: 'Short Break', icon: '☕', time: '5 min' },
            { key: 'longBreak', label: 'Long Break', icon: '🛋️', time: '15 min' }
          ].map((item) => (
            <button 
              key={item.key}
              onClick={() => handleModeChange(item.key as any)}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-center ${
                mode === item.key 
                  ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg transform scale-105` 
                  : 'bg-white/50 text-gray-700 hover:bg-white/70'
              }`}
            >
              <div className="text-sm">{item.icon}</div>
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-xs opacity-75">{item.time}</div>
            </button>
          ))}
        </div>

        {/* الوقت المخصص */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input 
              type="number" 
              min={1} 
              max={120}
              value={customTime} 
              onChange={(e) => setCustomTime(e.target.value)} 
              placeholder="Custom minutes" 
              className="w-full p-3 rounded-lg border border-gray-200 bg-white/70 backdrop-blur-sm text-center font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button 
            onClick={applyCustomTime} 
            className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
          >
            Set ⚡
          </button>
        </div>

        {/* الإعدادات الإضافية */}
        {showSettings && (
          <div className="bg-white/50 rounded-lg p-4 backdrop-blur-sm border border-white/20">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🔧 Settings
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">🔊 Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-10">{volume}%</span>
            </div>
          </div>
        )}

        {/* شريط التقدم السفلي */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroDialog;
