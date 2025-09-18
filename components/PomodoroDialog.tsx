import React from 'react';

type Mode = 'work' | 'shortBreak' | 'longBreak';

type Props = {
  open: boolean;
  onClose: () => void;
  timeLeft: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  setTimeLeft: (time: number) => void;
};

const PomodoroDialog: React.FC<Props> = ({
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

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface p-6 rounded-xl w-80 flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
        <span className="text-3xl font-mono">{formatTime(timeLeft)}</span>
        <div className="flex gap-2">
          {running
            ? <button onClick={pause} className="px-4 py-2 bg-yellow-400 rounded-md">Pause</button>
            : <button onClick={start} className="px-4 py-2 bg-green-400 rounded-md">Start</button>}
          <button onClick={reset} className="px-4 py-2 bg-red-400 rounded-md">Reset</button>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={()=>{setMode('work'); setTimeLeft(60*60)}} className={`px-3 py-1 rounded ${mode==='work'?'bg-blue-500 text-white':'bg-gray-200'}`}>Work</button>
          <button onClick={()=>{setMode('shortBreak'); setTimeLeft(5*60)}} className={`px-3 py-1 rounded ${mode==='shortBreak'?'bg-blue-500 text-white':'bg-gray-200'}`}>Short</button>
          <button onClick={()=>{setMode('longBreak'); setTimeLeft(15*60)}} className={`px-3 py-1 rounded ${mode==='longBreak'?'bg-blue-500 text-white':'bg-gray-200'}`}>Long</button>
        </div>

        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded-md">Close</button>
      </div>
    </div>
  );
};

export default PomodoroDialog;
