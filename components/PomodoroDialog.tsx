import React from 'react';

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
  if (!open) return null;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2,'0');
  const seconds = (timeLeft % 60).toString().padStart(2,'0');

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    if(newMode === 'work') setTimeLeft(25*60);
    if(newMode === 'shortBreak') setTimeLeft(5*60);
    if(newMode === 'longBreak') setTimeLeft(15*60);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg p-6 w-80 flex flex-col items-center gap-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-text-secondary hover:text-primary">✕</button>

        <h2 className="text-xl font-bold text-text-primary">Pomodoro Timer</h2>

        {/* الوقت */}
        <div className="text-4xl font-mono font-bold">{minutes}:{seconds}</div>

        {/* أزرار Start/Pause/Reset */}
        <div className="flex gap-3">
          {running ? 
            <button onClick={pause} className="px-4 py-2 bg-yellow-400 rounded text-black font-semibold hover:bg-yellow-500">Pause</button>
            :
            <button onClick={start} className="px-4 py-2 bg-green-500 rounded text-white font-semibold hover:bg-green-600">Start</button>
          }
          <button onClick={reset} className="px-4 py-2 bg-red-500 rounded text-white font-semibold hover:bg-red-600">Reset</button>
        </div>

        {/* اختيار Work / Break */}
        <div className="flex gap-2 mt-2">
          <button onClick={()=>handleModeChange('work')} className={`px-3 py-1 rounded ${mode==='work'?'bg-primary text-white':'bg-gray-200 text-text-primary'}`}>Work</button>
          <button onClick={()=>handleModeChange('shortBreak')} className={`px-3 py-1 rounded ${mode==='shortBreak'?'bg-primary text-white':'bg-gray-200 text-text-primary'}`}>Short Break</button>
          <button onClick={()=>handleModeChange('longBreak')} className={`px-3 py-1 rounded ${mode==='longBreak'?'bg-primary text-white':'bg-gray-200 text-text-primary'}`}>Long Break</button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroDialog;
