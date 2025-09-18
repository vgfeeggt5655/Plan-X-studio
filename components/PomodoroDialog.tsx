import React, { useState, useEffect, useCallback, useRef } from "react";

interface TimerMode {
  title: string;
  color: string;
  secondaryColor: string;
  bgGradient: string;
  glowColor: string;
  description: string;
  ringColor: string;
  defaultTime: number; // بالثواني
}

interface SessionStats {
  workTime: number;
  breakTime: number;
  sessions: number;
  totalTime: number;
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

const defaultModes: Record<"work" | "shortBreak" | "longBreak", TimerMode> = {
  work: {
    title: "Work 🍅",
    color: "text-indigo-500",
    secondaryColor: "text-indigo-300",
    bgGradient: "from-indigo-600 to-indigo-400",
    glowColor: "shadow-indigo-500/50",
    description: "Focus time",
    ringColor: "stroke-indigo-500",
    defaultTime: 25 * 60,
  },
  shortBreak: {
    title: "Short Break ☕",
    color: "text-emerald-500",
    secondaryColor: "text-emerald-300",
    bgGradient: "from-emerald-400 to-emerald-200",
    glowColor: "shadow-emerald-400/50",
    description: "Relax a bit",
    ringColor: "stroke-emerald-500",
    defaultTime: 5 * 60,
  },
  longBreak: {
    title: "Long Break 🛋️",
    color: "text-purple-500",
    secondaryColor: "text-purple-300",
    bgGradient: "from-purple-500 to-purple-300",
    glowColor: "shadow-purple-500/50",
    description: "Take a long rest",
    ringColor: "stroke-purple-500",
    defaultTime: 15 * 60,
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
  const [stats, setStats] = useState<SessionStats>({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
    totalTime: 0,
  });

  const [customTime, setCustomTime] = useState<number>(defaultModes[mode].defaultTime / 60);
  const [showStats, setShowStats] = useState(false);
  const [badge, setBadge] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const modeData = defaultModes[mode];

  const progress = 1 - timeLeft / defaultModes[mode].defaultTime;

  const handleStart = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    start();
  }, [start, setTimeLeft]);

  const handlePause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    pause();
  }, [pause]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    reset();
    setTimeLeft(defaultModes[mode].defaultTime);
    setBadge(false);
  }, [reset, setTimeLeft, mode]);

  const handleSessionEnd = () => {
    setBadge(true);
    const isWork = mode === "work";
    setStats((prev) => ({
      workTime: prev.workTime + (isWork ? defaultModes.work.defaultTime : 0),
      breakTime: prev.breakTime + (isWork ? 0 : defaultModes[mode].defaultTime),
      sessions: isWork ? prev.sessions + 1 : prev.sessions,
      totalTime: prev.totalTime + defaultModes[mode].defaultTime,
    }));

    // إشعار
    if (Notification.permission === "granted") {
      new Notification(`${modeData.title} ended!`);
    }

    // تبديل الوضع
    if (mode === "work") {
      const nextMode = (stats.sessions + 1) % 4 === 0 ? "longBreak" : "shortBreak";
      setMode(nextMode as "shortBreak" | "longBreak");
      setTimeLeft(defaultModes[nextMode as "shortBreak" | "longBreak"].defaultTime);
    } else {
      setMode("work");
      setTimeLeft(defaultModes.work.defaultTime);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (open && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-80 sm:w-96 max-w-full transform transition-transform duration-300 scale-100">
        {/* Tabs */}
        <div className="flex justify-between mb-4">
          {(["work", "shortBreak", "longBreak"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setTimeLeft(defaultModes[m].defaultTime);
              }}
              className={`flex-1 py-2 mx-1 rounded-lg font-semibold ${
                mode === m ? "bg-gradient-to-r " + defaultModes[m].bgGradient + " text-white" : "bg-gray-200 dark:bg-gray-800"
              }`}
            >
              {defaultModes[m].title}
            </button>
          ))}
        </div>

        {/* Progress Circle */}
        <div className="flex flex-col items-center justify-center relative my-4">
          <svg className="w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-gray-200"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
              className={`${modeData.ringColor} transition-all duration-500 transform -rotate-90 origin-center`}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div className="absolute text-3xl font-bold">{formatTime(timeLeft)}</div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3 my-2">
          {!running ? (
            <button onClick={handleStart} className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
              Start
            </button>
          ) : (
            <button onClick={handlePause} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              Pause
            </button>
          )}
          <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400">
            Reset
          </button>
        </div>

        {/* Custom Time */}
        <div className="flex justify-between items-center mt-4">
          <label>
            Custom Time (min):
            <input
              type="number"
              min={1}
              max={180}
              value={customTime}
              onChange={(e) => setCustomTime(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded w-20"
            />
          </label>
          <button
            onClick={() => {
              const newSeconds = Math.min(Math.max(customTime, 1), 180) * 60;
              setTimeLeft(newSeconds);
            }}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={() =>
              setStats({
                workTime: 0,
                breakTime: 0,
                sessions: 0,
                totalTime: 0,
              })
            }
            className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Reset Stats
          </button>
        </div>

        {showStats && (
          <div className="mt-4 p-2 rounded bg-gray-100 dark:bg-gray-800">
            <p>Work Time: {Math.floor(stats.workTime / 60)} min</p>
            <p>Break Time: {Math.floor(stats.breakTime / 60)} min</p>
            <p>Sessions: {stats.sessions}</p>
            <p>Total Time: {Math.floor(stats.totalTime / 60)} min</p>
            <p>
              Work/Break Ratio:{" "}
              {stats.breakTime > 0 ? (stats.workTime / stats.breakTime).toFixed(2) : "∞"}
            </p>
          </div>
        )}

        {/* Badge */}
        {badge && <div className="mt-2 text-green-500 font-bold text-center animate-bounce">🎉 Session Completed!</div>}

        {/* Close */}
        <button
          onClick={() => {
            handleReset();
            onClose();
          }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
