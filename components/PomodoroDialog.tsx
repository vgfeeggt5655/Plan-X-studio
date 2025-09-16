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
  setCustomTime: (minutes: number) => void;
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
  setCustomTime,
}) => {
  const [totalTime, setTotalTime] = useState(timeLeft);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
  });

  useEffect(() => {
    setTotalTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !sessionComplete) {
      setSessionComplete(true);

      const spentTime = totalTime - timeLeft; // الوقت المستهلك فعلياً
      if (mode === 'work') {
        setStats(prev => ({
          ...prev,
          workTime: prev.workTime + spentTime,
          sessions: prev.sessions + 1,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          breakTime: prev.breakTime + spentTime,
        }));
      }
    }
  }, [timeLeft, sessionComplete, mode, totalTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="bg-gray-900/95 text-white rounded-3xl shadow-2xl w-[90%] max-w-lg border border-gray-700/30">
        {/* Tabs */}
        <div className="flex bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/30 px-2 pt-6 mt-4">
          <div className="flex bg-gray-700/30 rounded-2xl p-1 w-full">
            {['work', 'shortBreak', 'longBreak'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab as PomodoroTimerProps['mode']);
                  setSessionComplete(false);
                  reset();
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  mode === tab
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'work'
                  ? 'عمل'
                  : tab === 'shortBreak'
                  ? 'استراحة قصيرة'
                  : 'استراحة طويلة'}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center justify-center py-10">
          <div className="text-[64px] font-bold tracking-wider text-indigo-400 drop-shadow-lg">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-3 mt-6">
            {running ? (
              <button
                onClick={pause}
                className="px-6 py-2 bg-yellow-500 text-black rounded-xl font-semibold hover:bg-yellow-400 transition"
              >
                إيقاف
              </button>
            ) : (
              <button
                onClick={start}
                className="px-6 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
              >
                تشغيل
              </button>
            )}
            <button
              onClick={() => {
                reset();
                setSessionComplete(false);
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-400 transition"
            >
              إعادة
            </button>
          </div>
        </div>

        {/* Custom Time */}
        <div className="px-6 mb-6">
          <label className="block text-sm text-gray-300 mb-2">
            تخصيص الوقت (دقائق)
          </label>
          <input
            type="number"
            min={1}
            max={120}
            onChange={e => setCustomTime(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Stats */}
        <div className="px-6 pb-6 text-sm text-gray-300 border-t border-gray-700/40">
          <div className="flex justify-between py-2">
            <span>إجمالي وقت العمل:</span>
            <span className="font-semibold text-indigo-400">
              {formatTime(stats.workTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>إجمالي وقت الاستراحة:</span>
            <span className="font-semibold text-green-400">
              {formatTime(stats.breakTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>عدد الجلسات:</span>
            <span className="font-semibold text-pink-400">
              {stats.sessions}
            </span>
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end p-4 border-t border-gray-700/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
