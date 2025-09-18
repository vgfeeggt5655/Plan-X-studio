import React, { useState, useEffect, useRef, useCallback } from "react";

export interface SessionStats {
  workTime: number;
  breakTime: number;
  sessions: number;
  totalTime: number;
}

export interface TimerMode {
  title: string;
  color: string;
  secondaryColor: string;
  bgGradient: string;
  glowColor: string;
  description: string;
  ringColor: string;
  defaultTime: number;
}

interface PomodoroTimerProps {
  open: boolean;
  onClose: () => void;
  timeLeft: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  mode: "work" | "shortBreak" | "longBreak";
  setMode: (mode: "work" | "shortBreak" | "longBreak") => void;
  setTimeLeft: (time: number) => void;
}

const MODES: Record<"work" | "shortBreak" | "longBreak", TimerMode> = {
  work: {
    title: "Work 🍅",
    color: "text-indigo-600",
    secondaryColor: "text-indigo-400",
    bgGradient: "from-indigo-500 to-indigo-700",
    glowColor: "shadow-indigo-500/50",
    description: "Focus on your work!",
    ringColor: "stroke-indigo-500",
    defaultTime: 25,
  },
  shortBreak: {
    title: "Short Break ☕",
    color: "text-emerald-600",
    secondaryColor: "text-emerald-400",
    bgGradient: "from-emerald-400 to-emerald-600",
    glowColor: "shadow-emerald-400/50",
    description: "Take a short break!",
    ringColor: "stroke-emerald-500",
    defaultTime: 5,
  },
  longBreak: {
    title: "Long Break 🛋️",
    color: "text-purple-600",
    secondaryColor: "text-purple-400",
    bgGradient: "from-purple-500 to-purple-700",
    glowColor: "shadow-purple-500/50",
    description: "Take a long break!",
    ringColor: "stroke-purple-500",
    defaultTime: 15,
  },
};

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
  setTimeLeft,
}) => {
  const [customTime, setCustomTime] = useState<number>(MODES[mode].defaultTime);
  const [stats, setStats] = useState<SessionStats>({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
    totalTime: 0,
  });
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = MODES[mode].defaultTime * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const handleSessionEnd = useCallback(() => {
    if (mode === "work") {
      setStats((prev) => ({
        ...prev,
        workTime: prev.workTime + totalTime,
        sessions: prev.sessions + 1,
        totalTime: prev.totalTime + totalTime,
      }));
      if ((stats.sessions + 1) % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(MODES.longBreak.defaultTime * 60);
      } else {
        setMode("shortBreak");
        setTimeLeft(MODES.shortBreak.defaultTime * 60);
      }
    } else {
      setStats((prev) => ({
        ...prev,
        breakTime: prev.breakTime + totalTime,
        totalTime: prev.totalTime + totalTime,
      }));
      setMode("work");
      setTimeLeft(MODES.work.defaultTime * 60);
    }
    setCompleted(true);
    if (typeof Notification !== "undefined") {
      new Notification("Pomodoro Timer", {
        body: `${MODES[mode].title} finished!`,
      });
    }
  }, [mode, setMode, setTimeLeft, stats.sessions, totalTime]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (running && timeLeft === 0) {
      handleSessionEnd();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, timeLeft, setTimeLeft, handleSessionEnd]);

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Math.max(1, Math.min(180, Number(e.target.value)));
    setCustomTime(val);
    setTimeLeft(val * 60);
  };

  const resetStats = () => {
    setStats({ workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 });
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-300 ease-in-out ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-gradient-to-br ${MODES[mode].bgGradient} p-6 rounded-2xl shadow-2xl w-96 max-w-full transform transition-transform duration-300 ease-in-out ${
          open ? "scale-100" : "scale-95"
        } ${MODES[mode].glowColor} shadow-xl`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold text-white`}>
            {MODES[mode].title}
          </h2>
          <button
            onClick={onClose}
            className="text-white text-xl font-bold hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Circle */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full rotate-[-90deg]">
            <circle
              cx="96"
              cy="96"
              r="86"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="86"
              stroke="white"
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 86}
              strokeDashoffset={(1 - progress / 100) * 2 * Math.PI * 86}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
            <span className="text-white/80 text-sm mt-1">
              {running ? "Running" : "Paused"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {running ? (
            <button
              onClick={pause}
              className="px-5 py-2.5 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-md"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={start}
              className="px-5 py-2.5 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-md"
            >
              Start
            </button>
          )}
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 active:scale-95 transition-all duration-200 shadow-md"
          >
            Reset
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex justify-around mb-6 bg-white/10 p-1 rounded-xl">
          {Object.entries(MODES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setMode(key as any);
                setTimeLeft(value.defaultTime * 60);
                setCustomTime(value.defaultTime);
              }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                mode === key
                  ? "bg-white text-gray-800 shadow-md"
                  : "bg-transparent text-white/80 hover:text-white"
              }`}
            >
              {value.title.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Custom Time */}
        <div className="mb-6 flex flex-col items-center">
          <label className="text-white/80 text-sm mb-2">Custom Time (Minutes)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={180}
              value={customTime}
              onChange={handleCustomTimeChange}
              className="w-32 accent-white"
            />
            <span className="text-white font-medium w-10">{customTime}</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white/10 p-4 rounded-xl mb-4 text-white backdrop-blur-sm">
          <h3 className="font-bold mb-3 text-center text-lg border-b border-white/20 pb-2">
            Session Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <p className="text-sm text-white/80">Work Time</p>
              <p className="font-semibold">{Math.floor(stats.workTime / 60)} min</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <p className="text-sm text-white/80">Break Time</p>
              <p className="font-semibold">{Math.floor(stats.breakTime / 60)} min</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <p className="text-sm text-white/80">Sessions</p>
              <p className="font-semibold">{stats.sessions}</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <p className="text-sm text-white/80">Total Time</p>
              <p className="font-semibold">{Math.floor(stats.totalTime / 60)} min</p>
            </div>
          </div>
          <button
            onClick={resetStats}
            className="mt-3 w-full py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 active:scale-95 transition-all duration-200"
          >
            Reset Stats
          </button>
        </div>

        {/* Completion Badge */}
        {completed && (
          <div className="text-center text-xl font-bold text-white animate-bounce mb-2 bg-white/20 py-2 rounded-lg">
            🎉 Session Complete!
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
