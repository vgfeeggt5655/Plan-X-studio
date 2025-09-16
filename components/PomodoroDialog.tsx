import React, { useState, useEffect, useRef } from "react";

type Mode = "work" | "shortBreak" | "longBreak";

const PomodoroTimer: React.FC = () => {
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<Mode>("work");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // صوت التنبيه
  const playAlarm = () => {
    const audio = new Audio("/data/رنين-المنبه-لشاومي.mp3");
    audio.play();
  };

  // تحديث العداد
  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playAlarm();
      setRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timeLeft]);

  // تغيير المود
  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "work") setTimeLeft(workDuration * 60);
    if (newMode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
    if (newMode === "longBreak") setTimeLeft(longBreakDuration * 60);
    setRunning(false);
  };

  // تحديث الوقت بعد تعديل القيم
  useEffect(() => {
    if (!running) {
      if (mode === "work") setTimeLeft(workDuration * 60);
      if (mode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
      if (mode === "longBreak") setTimeLeft(longBreakDuration * 60);
    }
  }, [workDuration, shortBreakDuration, longBreakDuration, mode, running]);

  // فورمات الوقت
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // progress للدائرة
  const total =
    mode === "work"
      ? workDuration * 60
      : mode === "shortBreak"
      ? shortBreakDuration * 60
      : longBreakDuration * 60;

  const progress = ((total - timeLeft) / total) * 283;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      {/* الهيدر */}
      <h1 className="text-3xl font-bold mb-6">
        {mode === "work"
          ? "وقت العمل"
          : mode === "shortBreak"
          ? "استراحة قصيرة"
          : "استراحة طويلة"}{" "}
        - {formatTime(timeLeft)}
      </h1>

      {/* الدائرة المتحركة */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#334155"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#38bdf8"
            strokeWidth="10"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={283 - progress}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-2 bg-green-600 rounded-lg"
        >
          تشغيل
        </button>
        <button
          onClick={() => setRunning(false)}
          className="px-4 py-2 bg-yellow-600 rounded-lg"
        >
          إيقاف
        </button>
        <button
          onClick={() => changeMode(mode)}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          إعادة
        </button>
      </div>

      {/* التبويبات */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => changeMode("work")}
          className={`px-4 py-2 rounded-full ${
            mode === "work" ? "bg-sky-500" : "bg-slate-700"
          }`}
        >
          عمل
        </button>
        <button
          onClick={() => changeMode("shortBreak")}
          className={`px-4 py-2 rounded-full ${
            mode === "shortBreak" ? "bg-sky-500" : "bg-slate-700"
          }`}
        >
          استراحة قصيرة
        </button>
        <button
          onClick={() => changeMode("longBreak")}
          className={`px-4 py-2 rounded-full ${
            mode === "longBreak" ? "bg-sky-500" : "bg-slate-700"
          }`}
        >
          استراحة طويلة
        </button>
      </div>

      {/* تخصيص الوقت */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <label>عمل:</label>
          <input
            type="number"
            min="1"
            value={workDuration}
            onChange={(e) => setWorkDuration(Number(e.target.value))}
            className="w-20 p-2 rounded bg-slate-800 text-center"
          />
          دقيقة
        </div>
        <div className="flex items-center gap-2">
          <label>استراحة قصيرة:</label>
          <input
            type="number"
            min="1"
            value={shortBreakDuration}
            onChange={(e) => setShortBreakDuration(Number(e.target.value))}
            className="w-20 p-2 rounded bg-slate-800 text-center"
          />
          دقيقة
        </div>
        <div className="flex items-center gap-2">
          <label>استراحة طويلة:</label>
          <input
            type="number"
            min="1"
            value={longBreakDuration}
            onChange={(e) => setLongBreakDuration(Number(e.target.value))}
            className="w-20 p-2 rounded bg-slate-800 text-center"
          />
          دقيقة
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
