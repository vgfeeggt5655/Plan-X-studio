import React, { useState, useEffect, useRef } from "react";

type TimerMode = "work" | "shortBreak" | "longBreak";

const PomodoroTimer: React.FC = () => {
  const modeTimes: Record<TimerMode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(modeTimes.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const audioRef = useRef(new Audio("/data/notification.mp3"));

  useEffect(() => {
    // إعادة ضبط الوقت عند تغيير الوضع
    setTimeLeft(modeTimes[mode]);
  }, [mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      audioRef.current.play();

      // منطق التبديل التلقائي بين الأوضاع
      if (mode === "work") {
        setSessionCount((prev) => prev + 1);
        const nextMode: TimerMode =
          (sessionCount + 1) % 4 === 0 ? "longBreak" : "shortBreak";
        setMode(nextMode);
      } else {
        setMode("work");
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, sessionCount]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(modeTimes.work);
    setSessionCount(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg w-full max-w-sm mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Pomodoro Timer</h2>

      <div className="flex justify-center mb-4 space-x-2">
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "work" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => handleModeChange("work")}
        >
          Work
        </button>
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "shortBreak" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => handleModeChange("shortBreak")}
        >
          Short Break
        </button>
        <button
          className={`px-3 py-1 rounded-md font-semibold ${mode === "longBreak" ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => handleModeChange("longBreak")}
        >
          Long Break
        </button>
      </div>

      <p className="text-6xl font-mono mb-6 text-gray-800">{formatTime(timeLeft)}</p>

      <p className="text-sm text-gray-600 mb-4">
        {mode === "work"
          ? `Work Session: ${sessionCount + 1}`
          : "Break Time"}
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={toggleTimer}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition shadow-md"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-400 transition shadow-md"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
