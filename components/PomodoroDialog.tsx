import React, { useState, useEffect, useRef } from 'react';

interface PomodoroDialogProps {
  open: boolean;
  onClose: () => void;
}

const PomodoroDialog: React.FC<PomodoroDialogProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [customTime, setCustomTime] = useState('');
  const [timeLeft, setTimeLeft] = useState(25*60); // بالثواني
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timer | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const totalTime = mode==='work'?25*60:mode==='shortBreak'?5*60:15*60;
  const progress = 1 - timeLeft/totalTime;

  const minutes = Math.floor(timeLeft/60).toString().padStart(2,'0');
  const seconds = (timeLeft%60).toString().padStart(2,'0');

  // مؤقت
  useEffect(() => {
    if(running){
      timerRef.current = setInterval(()=>{
        setTimeLeft(prev=>{
          if(prev<=1){
            clearInterval(timerRef.current!);
            setRunning(false);
            audioRef.current?.play();
            return 0;
          }
          return prev-1;
        })
      },1000);
    }
    return ()=> clearInterval(timerRef.current!);
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setTimeLeft(totalTime);
  }

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setTimeLeft(newMode==='work'?25*60:newMode==='shortBreak'?5*60:15*60);
  }

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if(!isNaN(minutesNum) && minutesNum>0){
      setTimeLeft(minutesNum*60);
      setCustomTime('');
      setRunning(false);
    }
  }

  if(!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg p-6 w-80 flex flex-col items-center gap-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-text-secondary hover:text-primary">✕</button>

        <h2 className="text-xl font-bold text-text-primary">Pomodoro Timer</h2>

        {/* حلقة دائرية متحركة */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="10" fill="none" />
            <circle
              cx="80" cy="80" r="70"
              stroke="#3b82f6"
              strokeWidth="10"
              fill="none"
              strokeDasharray={2*Math.PI*70}
              strokeDashoffset={2*Math.PI*70*(1-progress)}
              strokeLinecap="round"
              style={{transition:'stroke-dashoffset 1s linear'}}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-mono font-bold">
            {minutes}:{seconds}
          </div>
        </div>

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

        {/* وقت مخصص */}
        <div className="flex gap-2 mt-2">
          <input type="number" min={1} value={customTime} onChange={e=>setCustomTime(e.target.value)} placeholder="Minutes" className="w-20 p-1 rounded border border-gray-300 text-center"/>
          <button onClick={applyCustomTime} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Set</button>
        </div>

        <audio ref={audioRef} src="/data/رنين-المنبه-لشاومي.mp3" />
      </div>
    </div>
  )
}

export default PomodoroDialog;
