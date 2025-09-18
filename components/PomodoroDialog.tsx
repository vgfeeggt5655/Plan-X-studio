import React, { useState, useEffect, useRef, useCallback } from "react";
import { Transition } from "@headlessui/react";

export interface SessionStats {
  workTime: number;      // بالثواني
  breakTime: number;     // بالثواني
  sessions: number;      
  totalTime: number;     // بالثواني
}

export interface TimerMode {
  title: string;
  color: string;
  secondaryColor: string;
  bgGradient: string;
  glowColor: string;
  description: string;
  ringColor: string;
  defaultTime: number;   // بالدقائق
}

interface PomodoroTimerProps {
  open: boolean;
  onClose: () => void;
  timeLeft: number;      // بالثواني
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

  // حساب الإحصائيات والتحويل بين الأوضاع
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
    new Notification("Pomodoro Timer", {
      body: `${MODES[mode].title} finished!`,
    });
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

  return (
    <Transition show={open}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Transition.Child
          enter="transition duration-300"
          enterFrom="opacity-0 scale-75"
          enterTo="opacity-100 scale-100"
          leave="transition duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-75"
        >
          <div
            className={`bg-gradient-to-br ${MODES[mode].bgGradient} p-6 rounded-2xl shadow-xl w-96 max-w-full`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${MODES[mode].color}`}>
                {MODES[mode].title}
              </h2>
              <button
                onClick={onClose}
                className="text-white text-xl font-bold hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Progress Circle */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#ddd"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={`url(#gradient)`}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={(1 - progress / 100) * 2 * Math.PI * 70}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-4">
              {running ? (
                <button
                  onClick={pause}
                  className="px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={start}
                  className="px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Start
                </button>
              )}
              <button
                onClick={reset}
                className="px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
              >
                Reset
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex justify-around mb-4">
              {Object.keys(MODES).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setMode(k as any);
                    setTimeLeft(MODES[k as any].defaultTime * 60);
                  }}
                  className={`px-3 py-1 rounded-full font-semibold ${
                    mode === k
                      ? "bg-white text-gray-800"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {MODES[k as any].title}
                </button>
              ))}
            </div>

            {/* Custom Time */}
            <div className="mb-4 flex justify-center items-center gap-2">
              <input
                type="number"
                min={1}
                max={180}
                value={customTime}
                onChange={handleCustomTimeChange}
                className="w-20 px-2 py-1 rounded-lg text-center"
              />
              <span className="text-white">minutes</span>
            </div>

            {/* Statistics */}
            <div className="bg-white/20 p-3 rounded-lg mb-4 text-white">
              <h3 className="font-bold mb-2">Session Stats</h3>
              <p>Work Time: {Math.floor(stats.workTime / 60)} min</p>
              <p>Break Time: {Math.floor(stats.breakTime / 60)} min</p>
              <p>Sessions Completed: {stats.sessions}</p>
              <p>
                Total Time: {Math.floor(stats.totalTime / 60)} min
              </p>
              <button
                onClick={resetStats}
                className="mt-2 px-3 py-1 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
              >
                Reset Stats
              </button>
            </div>

            {/* Completion Badge */}
            {completed && (
              <div className="text-center text-2xl font-bold text-white animate-bounce mb-2">
                🎉 Session Complete!
              </div>
            )}
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default PomodoroTimer;
