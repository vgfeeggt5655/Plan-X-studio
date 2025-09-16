import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';

// Custom hook for the timer logic
const usePomodoroTimer = (initialTime: number, onComplete: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [running, onComplete]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = (newTime = initialTime) => {
    setRunning(false);
    setTimeLeft(newTime);
  };

  return { timeLeft, running, start, pause, reset, setTimeLeft };
};

interface PomodoroDialogProps {
  open: boolean;
  onClose: () => void;
}

const PomodoroDialog: React.FC<PomodoroDialogProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [customTime, setCustomTime] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalTimes = useMemo(() => ({
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }), []);

  const { timeLeft, running, start, pause, reset, setTimeLeft } = usePomodoroTimer(
    totalTimes.work,
    () => {
      setIsCompleted(true);
      audioRef.current?.play();
    }
  );

  useEffect(() => {
    setTimeLeft(totalTimes[mode]);
    setIsCompleted(false);
  }, [mode, totalTimes, setTimeLeft]);

  const progress = 1 - timeLeft / totalTimes[mode];
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    reset(totalTimes[newMode]);
    setIsCompleted(false);
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if (!isNaN(minutesNum) && minutesNum > 0) {
      setMode('work');
      reset(minutesNum * 60);
      setCustomTime('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg p-6 w-80 flex flex-col items-center gap-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors">✕</button>

        <h2 className="text-2xl font-bold text-gray-800">Pomodoro Timer</h2>

        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="10" fill="none" />
            <circle
              cx="80" cy="80" r="70"
              stroke="#3b82f6"
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-4xl font-mono font-bold text-gray-900">
            {isCompleted ? (
              <span className="text-xl text-green-600">Time's Up!</span>
            ) : (
              `${minutes}:${seconds}`
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {running ?
            <button onClick={pause} className="px-5 py-2 bg-yellow-400 rounded-lg text-black font-semibold hover:bg-yellow-500 transition-colors">Pause</button>
            :
            <button onClick={start} className="px-5 py-2 bg-green-500 rounded-lg text-white font-semibold hover:bg-green-600 transition-colors">Start</button>
          }
          <button onClick={() => handleModeChange(mode)} className="px-5 py-2 bg-red-500 rounded-lg text-white font-semibold hover:bg-red-600 transition-colors">Reset</button>
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={() => handleModeChange('work')} className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'work' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Work</button>
          <button onClick={() => handleModeChange('shortBreak')} className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'shortBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Short Break</button>
          <button onClick={() => handleModeChange('longBreak')} className={`px-4 py-2 rounded-full font-medium transition-colors ${mode === 'longBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Long Break</button>
        </div>

        <div className="flex gap-2 mt-2 w-full justify-center">
          <input
            type="number"
            min={1}
            value={customTime}
            onChange={e => setCustomTime(e.target.value)}
            placeholder="Minutes"
            className="w-24 p-2 rounded-lg border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={applyCustomTime}
            disabled={!customTime || isNaN(parseInt(customTime))}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold transition-colors ${!customTime || isNaN(parseInt(customTime)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            Set
          </button>
        </div>

        <audio ref={audioRef} src="/data/رنين-المنبه-لشاومي.mp3" />
      </div>
    </div>
  );
};

export default PomodoroDialog;
