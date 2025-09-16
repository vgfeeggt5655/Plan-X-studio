import React, { useState, useEffect } from 'react';

const PomodoroTimer = ({
  open, onClose, timeLeft, running,
  start, pause, reset, mode, setMode, setTimeLeft
}) => {
  const [customTime, setCustomTime] = useState(25);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (timeLeft === 0 && !sessionComplete) setSessionComplete(true);
  }, [timeLeft, sessionComplete]);

  if (!open) return null;

  const totalTime = mode === 'work' ? 25*60 : mode === 'shortBreak' ? 5*60 : 15*60;
  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={onClose}></div>

      <div className="relative z-10 bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 
                      rounded-3xl shadow-2xl border border-sky-700/30 p-8 w-[420px]">
        
        {/* العنوان */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-sky-300 capitalize">
            {mode === 'work' ? 'Pomodoro' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </h2>
          <p className="text-slate-400 text-sm">Stay focused and track your time</p>
        </div>

        {/* progress bar جديد (نصف دائري) */}
        <div className="relative flex justify-center mb-6">
          <div className="w-64 h-32 relative">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <path
                d="M10,50 A40,40 0 0,1 90,50"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="8"
                strokeDasharray="126"
                strokeDashoffset={126 - (progress * 126) / 100}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8"/>
                  <stop offset="100%" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
              <div className="text-4xl font-mono font-bold text-white">{minutes}:{seconds}</div>
              <div className="text-sm text-slate-400">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex justify-center gap-4 mb-6">
          {running ? (
            <button onClick={pause}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold">
              Pause
            </button>
          ) : (
            <button onClick={start}
              disabled={timeLeft === 0}
              className={`px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold
                          ${timeLeft===0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {timeLeft===0 ? 'Done' : 'Start'}
            </button>
          )}
          <button onClick={() => { reset(); setSessionComplete(false); }}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-2xl font-bold">
            Reset
          </button>
        </div>

        {/* slider لاختيار الوقت */}
        <div className="text-center space-y-2">
          <input
            type="range"
            min="1"
            max="120"
            value={customTime}
            onChange={(e) => setCustomTime(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="text-slate-300">⏱ {customTime} min</div>
          <button onClick={() => setTimeLeft(customTime * 60)}
            className="mt-2 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium">
            Set Custom Time
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
