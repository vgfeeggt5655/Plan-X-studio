import React, { useState, useEffect } from "react";

interface PomodoroTimerProps {
  open: boolean;
  onClose: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ open, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(60 * 60); // ساعة افتراضي
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (running && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [running, timeLeft]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setTimeLeft(60 * 60); // يرجع ساعة
  };

  return (
    open && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Pomodoro Timer</h2>
          <div className="text-4xl font-mono text-center mb-6">
            {Math.floor(timeLeft / 60)
              .toString()
              .padStart(2, "0")}
            :
            {(timeLeft % 60).toString().padStart(2, "0")}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={start}
              className="px-4 py-2 rounded bg-green-500 text-white"
            >
              Start
            </button>
            <button
              onClick={pause}
              className="px-4 py-2 rounded bg-yellow-500 text-white"
            >
              Pause
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Reset
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 rounded bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    )
  );
};

export default PomodoroTimer;
