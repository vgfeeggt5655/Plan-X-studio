import React, { useState, useEffect } from "react";

interface PomodoroTimerProps {
  onComplete?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [sessionComplete, setSessionComplete] = useState(false);

  const [customTime, setCustomTime] = useState("");
  const [customTotalTime, setCustomTotalTime] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // total time
  const getTotalTime = () => {
    if (customTotalTime) return customTotalTime;
    switch (mode) {
      case "work":
        return 25 * 60;
      case "shortBreak":
        return 5 * 60;
      case "longBreak":
        return 15 * 60;
      default:
        return 25 * 60;
    }
  };

  const totalTime = getTotalTime();
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  // countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setRunning(false);
      setSessionComplete(true);
      onComplete?.();
      const audio = new Audio("/رنين-المنبه-لشاومي.mp3");
      audio.play();
    }
    return () => clearInterval(timer);
  }, [running, timeLeft, onComplete]);

  // switch mode
  const switchMode = (newMode: "work" | "shortBreak" | "longBreak") => {
    setMode(newMode);
    setRunning(false);
    setSessionComplete(false);
    setCustomTotalTime(null);
    if (newMode === "work") setTimeLeft(25 * 60);
    if (newMode === "shortBreak") setTimeLeft(5 * 60);
    if (newMode === "longBreak") setTimeLeft(15 * 60);
  };

  const applyCustomTime = () => {
    const minutesNum = parseInt(customTime);
    if (!isNaN(minutesNum) && minutesNum > 0 && minutesNum <= 120) {
      const newTime = minutesNum * 60;
      setTimeLeft(newTime);
      setCustomTotalTime(newTime);
      setCustomTime("");
      setShowCustomInput(false);
      setSessionComplete(false);
    }
  };

  // format mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* التابات */}
      <div className="flex gap-3 mb-6">
        {["work", "shortBreak", "longBreak"].map((m) => (
          <button
            key={m}
            onClick={() =>
              switchMode(m as "work" | "shortBreak" | "longBreak")
            }
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === m
                ? "bg-teal-500 text-white shadow-lg scale-105"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {m === "work"
              ? "العمل"
              : m === "shortBreak"
              ? "راحة قصيرة"
              : "راحة طويلة"}
          </button>
        ))}
      </div>

      {/* الدائرة */}
      <div className="relative w-56 h-56 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="100"
            stroke="#334155"
            strokeWidth="14"
            fill="none"
          />
          <circle
            cx="112"
            cy="112"
            r="100"
            stroke="url(#gradient)"
            strokeWidth="14"
            fill="none"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-100">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-4">
        <button
          onClick={() => setRunning(!running)}
          className="px-6 py-2 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-all shadow-md"
        >
          {running ? "إيقاف" : "ابدأ"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setTimeLeft(totalTime);
            setSessionComplete(false);
          }}
          className="px-6 py-2 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all"
        >
          إعادة
        </button>
        <button
          onClick={() => setShowCustomInput(true)}
          className="px-6 py-2 rounded-full bg-sky-700 text-slate-100 hover:bg-sky-600 transition-all"
        >
          وقت مخصص
        </button>
      </div>

      {/* إدخال وقت مخصص */}
      {showCustomInput && (
        <div className="flex mt-6 gap-2 items-center">
          <input
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="دقائق"
            className="px-3 py-2 rounded-lg bg-slate-800 text-white w-24 text-center focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <button
            onClick={applyCustomTime}
            className="px-4 py-2 rounded-full bg-teal-500 text-white hover:bg-teal-400 transition-all"
          >
            OK
          </button>
        </div>
      )}

      {sessionComplete && (
        <p className="mt-4 text-lg text-green-400 font-semibold">
          انتهت الجلسة 🎉
        </p>
      )}
    </div>
  );
};

export default PomodoroTimer;
