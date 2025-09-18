import React, { useCallback, useEffect, useRef, useState } from "react";

interface PomodoroTimerProps {
  open: boolean;
  onClose: () => void;
  timeLeft: number; // seconds
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  mode: "work" | "shortBreak" | "longBreak";
  setMode: (mode: "work" | "shortBreak" | "longBreak") => void;
  setTimeLeft: (seconds: number) => void;
}

interface SessionStats {
  workTime: number; // seconds
  breakTime: number; // seconds
  sessions: number;
  totalTime: number; // seconds
}

interface TimerMode {
  title: string;
  color: string;
  secondaryColor: string;
  bgGradient: string;
  glowColor: string;
  description: string;
  ringColor: string;
  defaultTime: number; // seconds
}

const STORAGE_KEY = "pomodoro_stats_v1";

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
  // UI state
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  // runtime refs
  const initialTimeRef = useRef<number>(timeLeft || 1500); // seconds
  const prevTimeRef = useRef<number>(timeLeft);
  const sessionStartRef = useRef<number | null>(null);
  const modeRef = useRef<string>(mode);
  const autoSwitchTimeout = useRef<number | null>(null);

  // stats (persisted)
  const [stats, setStats] = useState<SessionStats>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as SessionStats;
    } catch (e) { }
    return { workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 };
  });

  const [completedWorkSessions, setCompletedWorkSessions] = useState<number>(() => {
    // Also persist this state so the cycle count isn't lost on refresh
    try {
      const raw = localStorage.getItem("completed_work_sessions");
      if (raw) return parseInt(raw, 10);
    } catch (e) { }
    return 0;
  });

  // mode configs
  const getModeConfig = useCallback((): TimerMode => {
    const configs: Record<string, TimerMode> = {
      work: {
        title: "Focus Session",
        color: "#6366F1",
        secondaryColor: "#818CF8",
        bgGradient: "from-indigo-900/30 via-slate-900 to-slate-900",
        glowColor: "rgba(99, 102, 241, 0.18)",
        description: "Time to Focus & Work",
        ringColor: "ring-indigo-500/40",
        defaultTime: 25 * 60,
      },
      shortBreak: {
        title: "Short Break",
        color: "#10B981",
        secondaryColor: "#34D399",
        bgGradient: "from-emerald-900/30 via-slate-900 to-slate-900",
        glowColor: "rgba(16, 185, 129, 0.18)",
        description: "Take a Short Break",
        ringColor: "ring-emerald-500/40",
        defaultTime: 5 * 60,
      },
      longBreak: {
        title: "Long Break",
        color: "#8B5CF6",
        secondaryColor: "#A78BFA",
        bgGradient: "from-purple-900/30 via-slate-900 to-slate-900",
        glowColor: "rgba(139, 92, 246, 0.18)",
        description: "Enjoy Your Long Break",
        ringColor: "ring-purple-500/40",
        defaultTime: 15 * 60,
      },
    };
    return configs[mode] ?? configs.work;
  }, [mode]);

  // Persist stats and completed work sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      localStorage.setItem("completed_work_sessions", completedWorkSessions.toString());
    } catch (e) { }
  }, [stats, completedWorkSessions]);

  // When mode changes and timer is idle, reset timeLeft to mode default
  useEffect(() => {
    if (modeRef.current !== mode) {
      const cfg = getModeConfig();
      if (!running) {
        setTimeLeft(cfg.defaultTime);
        initialTimeRef.current = cfg.defaultTime;
      }
      setSessionComplete(false);
      modeRef.current = mode;
    }
  }, [mode, getModeConfig, running, setTimeLeft]);

  // Track session start/stop timestamp
  useEffect(() => {
    if (running && sessionStartRef.current === null) {
      sessionStartRef.current = Date.now();
      // capture initial time when session actually starts
      if (timeLeft > 0) initialTimeRef.current = timeLeft;
    }
    if (!running && sessionStartRef.current !== null) {
      sessionStartRef.current = null;
    }
  }, [running, timeLeft]);

  // Detect session finish transition and update stats
  useEffect(() => {
    // detect falling edge: prev > 0 and current === 0
    if (prevTimeRef.current > 0 && timeLeft === 0) {
      // compute elapsed seconds accurately if we have a start timestamp
      const elapsed = sessionStartRef.current
        ? Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000))
        : Math.max(1, initialTimeRef.current);

      // stop the timer
      try {
        pause();
      } catch (e) { }

      setSessionComplete(true);

      // update stats
      setStats((prev) => {
        const next = { ...prev };
        if (mode === "work") {
          next.workTime += elapsed;
          next.sessions += 1;
          next.totalTime += elapsed;
        } else {
          next.breakTime += elapsed;
          next.totalTime += elapsed;
        }
        return next;
      });

      // --- Change for Problem #1 ---
      // Update completed work counter and set the next mode, but DON'T start the timer.
      if (mode === "work") {
        setCompletedWorkSessions((prev) => {
          const nextCount = prev + 1;
          const isLong = nextCount % 4 === 0;
          const newMode = isLong ? "longBreak" : "shortBreak";

          // Schedule a small delay to smoothly switch the UI
          if (autoSwitchTimeout.current) {
            window.clearTimeout(autoSwitchTimeout.current);
          }
          autoSwitchTimeout.current = window.setTimeout(() => {
            setMode(newMode);
          }, 700) as unknown as number;

          return nextCount;
        });
      }

      // clear session start marker
      sessionStartRef.current = null;

      // Request notification (if permitted)
      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`${getModeConfig().title} completed!`, {
            body: mode === "work" ? "Time for a break!" : "Ready to focus again?",
          });
        }
      } catch (e) { }
    }

    prevTimeRef.current = timeLeft;
  }, [timeLeft, pause, getModeConfig, mode, setMode, setTimeLeft]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSwitchTimeout.current) window.clearTimeout(autoSwitchTimeout.current);
    };
  }, []);

  // Notification permission on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => { });
      }
    } catch (e) { }
  }, []);

  // Handlers
  const handleModeChange = useCallback(
    (newMode: "work" | "shortBreak" | "longBreak") => {
      // only allow mode changes when timer is idle
      if (running) return;
      setMode(newMode);
      setSessionComplete(false);
      setShowCustomInput(false);
      setCustomMinutes("");
      const cfg = getModeConfig();
      setTimeLeft(cfg.defaultTime);
      initialTimeRef.current = cfg.defaultTime;
    },
    [running, setMode, getModeConfig, setTimeLeft]
  );

  const applyCustomTime = useCallback(() => {
    const minutes = parseInt(customMinutes, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      alert("Please enter a valid time between 1 and 180 minutes");
      return;
    }
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    initialTimeRef.current = seconds;
    setCustomMinutes("");
    setShowCustomInput(false);
    setSessionComplete(false);
  }, [customMinutes, setTimeLeft]);

  const handleReset = useCallback(() => {
    try {
      reset();
    } catch (e) { }
    const cfg = getModeConfig();
    setTimeLeft(cfg.defaultTime);
    initialTimeRef.current = cfg.defaultTime;
    setSessionComplete(false);
    sessionStartRef.current = null;
  }, [reset, getModeConfig, setTimeLeft]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowStats(false);
      setShowCustomInput(false);
    }, 260);
  }, [onClose]);

  const resetStats = useCallback(() => {
    if (!confirm("Are you sure you want to reset all statistics?")) return;
    const empty: SessionStats = { workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 };
    setStats(empty);
    setCompletedWorkSessions(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("completed_work_sessions");
    } catch (e) { }
  }, []);

  // helpers
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!open && !isClosing) return null;

  const cfg = getModeConfig();
  const progress = initialTimeRef.current > 0 ? Math.max(0, Math.min(1, (initialTimeRef.current - timeLeft) / initialTimeRef.current)) : 0;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secondsStr = (timeLeft % 60).toString().padStart(2, "0");

  // circle geometry
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // stats derived
  const totalProductiveTime = stats.workTime + stats.breakTime;
  const workPercentage = totalProductiveTime > 0 ? (stats.workTime / totalProductiveTime) * 100 : 0;
  const avgSessionTime = stats.sessions > 0 ? Math.round(stats.workTime / stats.sessions / 60) : 0;

  // --- Change for Problem #3 ---
  const currentCycleProgress = (completedWorkSessions % 4) || (completedWorkSessions > 0 ? 4 : 0);
  const sessionsToLongBreak = 4 - currentCycleProgress;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

      {/* --- Change for Problem #2 --- */}
      {/* Added flex and flex-col to enable scrolling on the container */}
      <div className={`relative z-10 bg-gradient-to-br ${cfg.bgGradient} rounded-3xl shadow-2xl border border-slate-700/50 p-0 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"} flex flex-col`}>
        <button onClick={handleClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/70 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 z-20 backdrop-blur-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* This div will now grow and take up available space, enabling proper scrolling */}
        <div className="p-6 pb-6 flex-1 flex flex-col">
          <div className="flex bg-slate-800/40 rounded-2xl p-1.5 mb-6">
            {[
              { key: "work", label: "Focus", icon: "🍅" },
              { key: "shortBreak", label: "Short Break", icon: "☕" },
              { key: "longBreak", label: "Long Break", icon: "🛋️" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleModeChange(tab.key as any)}
                disabled={running}
                className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-300 rounded-xl flex items-center justify-center gap-2 ${
                  mode === tab.key
                    ? "text-white bg-slate-700/60 shadow-lg transform scale-105"
                    : `text-slate-400 ${running ? "opacity-50 cursor-not-allowed" : "hover:text-white hover:bg-slate-700/30"}`
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>


          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: cfg.color }}>
              {cfg.title}
            </h2>
            <p className="text-slate-400 text-sm">{cfg.description}</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-72 h-72 rounded-full border-4 border-slate-700/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm" />

                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id={`gradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={cfg.color} />
                      <stop offset="100%" stopColor={cfg.secondaryColor} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={`url(#gradient-${mode})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    filter="url(#glow)"
                  />
                </svg>

                <div className="relative z-10 text-center">
                  <div className="text-6xl font-mono font-bold text-white mb-3 tracking-tight">{minutes}:{secondsStr}</div>
                  <div className="text-lg text-slate-300 mb-2">{Math.round(progress * 100)}% Complete</div>

                  {running && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/40 backdrop-blur-sm animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium uppercase tracking-wider">{mode === "work" ? "FOCUS MODE" : "BREAK TIME"}</span>
                    </div>
                  )}

                  {sessionComplete && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
                      <span className="text-lg">🎉</span>
                      <span className="text-xs font-medium">SESSION COMPLETE!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {running ? (
              <button onClick={pause} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-w-[140px] justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </button>
            ) : (
              <button onClick={start} disabled={timeLeft === 0} className={`px-8 py-4 font-bold rounded-2xl shadow-lg transform transition-all duration-200 flex items-center gap-3 min-w-[140px] justify-center ${timeLeft === 0 ? "bg-slate-600/50 text-slate-400 cursor-not-allowed" : "hover:scale-105 text-white shadow-xl"}`} style={timeLeft > 0 ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.secondaryColor})`, boxShadow: `0 8px 32px ${cfg.glowColor}` } : {}}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {timeLeft === 0 ? "Finished" : "Start"}
              </button>
            )}

            <button onClick={handleReset} className="px-6 py-4 bg-slate-700/60 hover:bg-slate-600/80 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3 backdrop-blur-sm border border-slate-600/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button onClick={() => setShowCustomInput((s) => !s)} disabled={running} className={`px-6 py-3 rounded-xl bg-slate-700/40 text-slate-300 transition-all duration-200 font-medium flex items-center gap-2 ${running ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-700/60 hover:text-white"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
              </svg>
              Custom
            </button>

            <button onClick={() => setShowStats((s) => !s)} className="px-6 py-3 rounded-xl bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </button>
          </div>

          {showCustomInput && (
            <div className="mb-6 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set Custom Duration
              </h3>
              <div className="flex gap-3">
                <input type="number" min={1} max={180} value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Minutes (1-180)" className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 font-medium" onKeyPress={(e) => { if (e.key === "Enter") applyCustomTime(); }} />
                <button onClick={applyCustomTime} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg">
                  Apply
                </button>
              </div>
            </div>
          )}

          {showStats && (
            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-medium flex items-center gap-2">Session Statistics</h3>
                <button onClick={resetStats} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200">Reset</button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stats.sessions}</div>
                  <div className="text-slate-400 text-sm">Completed Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{Math.floor(stats.workTime / 3600)}h {Math.floor((stats.workTime % 3600) / 60)}m</div>
                  <div className="text-slate-400 text-sm">Total Focus Time</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Session:</span>
                  <span className="text-white font-medium">{avgSessionTime} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Break Time:</span>
                  <span className="text-white font-medium">{Math.floor(stats.breakTime / 60)} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Work Focus:</span>
                  <span className="text-white font-medium">{workPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Next Break Type:</span>
                  <span className="text-white font-medium">{(completedWorkSessions + 1) % 4 === 0 ? '🛋️ Long Break' : '☕ Short Break'}</span>
                </div>
                <div className="flex justify-between items-center">
                  {/* --- Change for Problem #3 --- */}
                  <span className="text-slate-400">Sessions to Long Break:</span>
                  <span className="text-white font-medium">{sessionsToLongBreak === 0 ? 4 : sessionsToLongBreak} sessions</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/40">
                <div className="text-xs text-slate-400 mb-2">Focus vs Break Time</div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${workPercentage}%` }} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/40">
                <div className="text-xs text-slate-400 mb-3">Current Pomodoro Cycle</div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4].map((session) => (
                    <div key={session} className="flex flex-col items-center gap-1">
                      {/* --- Change for Problem #3 --- */}
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                        session <= currentCycleProgress
                          ? 'bg-indigo-500 border-indigo-400 text-white'
                          : 'border-slate-600 text-slate-400'
                        }`}>
                        🍅
                      </div>
                      <div className="text-xs text-slate-500">{session < 4 ? 'Work' : 'Long'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
