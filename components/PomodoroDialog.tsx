// PomodoroTimer.tsx
import React, { useEffect, useRef, useState } from "react";

type Mode = "work" | "shortBreak" | "longBreak";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMinutes?: {
    work?: number;
    shortBreak?: number;
    longBreak?: number;
  };
  persistKey?: string; // اختياري لحفظ الإحصائيات في localStorage
}

export default function PomodoroTimer({
  open,
  onClose,
  defaultMinutes,
  persistKey = "pomodoro_stats_v1",
}: Props) {
  // الافتراضيات بالدقائق
  const defaults = {
    work: defaultMinutes?.work ?? 25,
    shortBreak: defaultMinutes?.shortBreak ?? 5,
    longBreak: defaultMinutes?.longBreak ?? 15,
  };

  // durations بالثواني لكل مود
  const [durations, setDurations] = useState<Record<Mode, number>>({
    work: defaults.work * 60,
    shortBreak: defaults.shortBreak * 60,
    longBreak: defaults.longBreak * 60,
  });

  const [mode, setMode] = useState<Mode>("work");
  const startTimeRef = useRef<number | null>(null); // ms
  const [accumulated, setAccumulated] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [appliedAnim, setAppliedAnim] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sessionCompleteFlag, setSessionCompleteFlag] = useState(false);

  // إحصائيات محفوظة (بالثواني)
  const [stats, setStats] = useState({
    workTime: 0,
    breakTime: 0,
    sessions: 0,
  });

  // load saved stats
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStats((s) => ({ ...s, ...parsed }));
      }
    } catch {}
  }, [persistKey]);

  // save stats on change
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(stats));
    } catch {}
  }, [stats, persistKey]);

  // حساب الوقت المستغرق حاليا
  const getElapsed = () => {
    const runningElapsed =
      startTimeRef.current !== null
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
    return accumulated + runningElapsed;
  };

  const getTimeLeft = () => {
    const left = durations[mode] - getElapsed();
    return Math.max(0, left);
  };

  // تشغيل صوت التنبيه من الملف
  const playAlarm = async () => {
    try {
      const a = new Audio("/data/رنين-المنبه-لشاومي.mp3");
      await a.play().catch(() => {});
    } catch {}
  };

  // وظائف التشغيل
  const start = () => {
    if (getTimeLeft() <= 0) resetSession();
    if (running) return;
    startTimeRef.current = Date.now();
    setRunning(true);
  };

  const pause = () => {
    if (!running) return;
    const elapsedSinceStart = Math.floor((Date.now() - (startTimeRef.current ?? 0)) / 1000);
    setAccumulated((prev) => prev + Math.max(0, elapsedSinceStart));
    startTimeRef.current = null;
    setRunning(false);
  };

  const resetSession = () => {
    startTimeRef.current = null;
    setAccumulated(0);
    setRunning(false);
    setSessionCompleteFlag(false);
  };

  const endSessionAndLog = () => {
    const elapsed = getElapsed();
    if (elapsed > 0) {
      if (mode === "work") {
        setStats((s) => ({
          ...s,
          workTime: s.workTime + elapsed,
          sessions: s.sessions + 1,
        }));
      } else {
        setStats((s) => ({ ...s, breakTime: s.breakTime + elapsed }));
      }
    }
    startTimeRef.current = null;
    setAccumulated(0);
    setRunning(false);
    setSessionCompleteFlag(false);
  };

  const handleComplete = () => {
    const full = durations[mode];
    if (mode === "work") {
      setStats((s) => ({ ...s, workTime: s.workTime + full, sessions: s.sessions + 1 }));
    } else {
      setStats((s) => ({ ...s, breakTime: s.breakTime + full }));
    }
    startTimeRef.current = null;
    setAccumulated(full);
    setRunning(false);
    setSessionCompleteFlag(true);
    playAlarm();
    setTimeout(() => setSessionCompleteFlag(false), 2000);
  };

  const changeMode = (next: Mode) => {
    if (running) return;
    setMode(next);
    resetSession();
  };

  const applyCustomMinutes = (minutes: number) => {
    if (minutes <= 0 || minutes > 1440) return;
    setDurations((prev) => ({ ...prev, [mode]: Math.floor(minutes * 60) }));
    resetSession();
    setAppliedAnim(true);
    setTimeout(() => setAppliedAnim(false), 1500);
  };

  const format = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  };

  const timeLeft = getTimeLeft();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-gray-900/80 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/30 overflow-hidden">
        {/* التابات */}
        <div className="px-4 pt-6 pb-3">
          <div className="flex bg-gray-800/40 rounded-2xl p-1">
            <button
              onClick={() => changeMode("work")}
              disabled={running}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                mode === "work"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-300 hover:text-white"
              } ${running ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => changeMode("shortBreak")}
              disabled={running}
              className={`flex-1 py-2 rounded-xl ml-2 text-sm font-medium transition ${
                mode === "shortBreak"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-gray-300 hover:text-white"
              } ${running ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Short Break
            </button>
            <button
              onClick={() => changeMode("longBreak")}
              disabled={running}
              className={`flex-1 py-2 rounded-xl ml-2 text-sm font-medium transition ${
                mode === "longBreak"
                  ? "bg-purple-600 text-white shadow"
                  : "text-gray-300 hover:text-white"
              } ${running ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Long Break
            </button>
          </div>
        </div>

        {/* شاشة التايمر */}
        <div className="px-6 pb-6 text-center">
          <div className="text-5xl font-mono font-bold text-white mt-6">{format(timeLeft)}</div>
          {sessionCompleteFlag && (
            <div className="mt-2 text-xs text-emerald-300 font-medium">Session complete</div>
          )}
          <div className="flex justify-center gap-3 mt-6">
            {running ? (
              <button
                onClick={pause}
                className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-medium shadow"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={start}
                className={`px-5 py-2 rounded-xl font-medium shadow ${
                  timeLeft === 0
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-green-500 text-black"
                }`}
                disabled={timeLeft === 0}
              >
                Start
              </button>
            )}
            <button
              onClick={endSessionAndLog}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium"
            >
              End & Log
            </button>
            <button
              onClick={resetSession}
              className="px-4 py-2 rounded-xl bg-gray-700 text-white font-medium"
            >
              Reset
            </button>
          </div>

          {/* تخصيص الوقت */}
          <div className="mt-6">
            <label className="text-sm text-gray-300">Custom time (minutes)</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min={1}
                max={1440}
                defaultValue={Math.round(durations[mode] / 60)}
                id="customMinutesInput"
                className={`flex-1 px-4 py-2 rounded-xl bg-gray-800 border outline-none transition ${
                  appliedAnim ? "ring-2 ring-green-400 animate-pulse" : "border-gray-700"
                }`}
              />
              <button
                onClick={() => {
                  const el = document.getElementById("customMinutesInput") as HTMLInputElement;
                  if (!el) return;
                  const v = Number(el.value);
                  if (!isFinite(v) || v <= 0) return;
                  applyCustomMinutes(Math.floor(v));
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-medium"
              >
                Apply
              </button>
            </div>
          </div>

          {/* إحصائيات */}
          <div className="mt-6 border-t border-gray-700/30 pt-4 text-sm text-white">
            Work: {format(stats.workTime)} | Break: {format(stats.breakTime)} | Sessions:{" "}
            {stats.sessions}
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-700 text-white">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
