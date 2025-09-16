import React, { useState, useEffect } from "react";

type TimerMode = "work" | "shortBreak" | "longBreak";

const PomodoroTimer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const modeTimes: Record<TimerMode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    setTimeLeft(modeTimes[mode]);
  }, [mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      const audio = new Audio("/data/notification.mp3"); // ضع صوتك هنا
      audio.play();
      alert(`🛑 ${mode === "work" ? "وقت العمل انتهى!" : "استراحة انتهت!"}`);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => setTimeLeft(modeTimes[mode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg w-full max-w-sm mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Pomodoro Timer</h2>

      <div className="flex justify-center mb-4 space-x-2">
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "work" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setMode("work")}
        >
          Work
        </button>
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "shortBreak" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setMode("shortBreak")}
        >
          Short Break
        </button>
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "longBreak" ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setMode("longBreak")}
        >
          Long Break
        </button>
      </div>

      <p className="text-4xl font-mono mb-6">{formatTime(timeLeft)}</p>

      <div className="flex justify-center gap-4">
        <button
          onClick={toggleTimer}
          className="px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={resetTimer}
          className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
