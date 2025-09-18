import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "work" | "shortBreak" | "longBreak";

const STORAGE_KEY = "planx_pomodoro_v1";

export default function PomodoroDialog({ open, onClose }: Props) {
  // default settings
  const [workMin, setWorkMin] = useState<number>(60); // user wanted default 1 hour
  const [shortMin, setShortMin] = useState<number>(5);
  const [longMin, setLongMin] = useState<number>(15);
  const [roundsBeforeLong, setRoundsBeforeLong] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);

  // runtime state
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState<number>(workMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [completedRounds, setCompletedRounds] = useState<number>(0);

  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // load/save settings
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.workMin) setWorkMin(parsed.workMin);
        if (parsed.shortMin) setShortMin(parsed.shortMin);
        if (parsed.longMin) setLongMin(parsed.longMin);
        if (parsed.roundsBeforeLong) setRoundsBeforeLong(parsed.roundsBeforeLong);
        if (parsed.autoStartNext !== undefined) setAutoStartNext(parsed.autoStartNext);
      } catch {}
    }
  }, []);

  useEffect(() => {
    // update timeLeft when settings or mode changes
    if (mode === "work") setTimeLeft(workMin * 60);
    if (mode === "shortBreak") setTimeLeft(shortMin * 60);
    if (mode === "longBreak") setTimeLeft(longMin * 60);
  }, [mode, workMin, shortMin, longMin]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workMin, shortMin, longMin, roundsBeforeLong, autoStartNext })
    );
  }, [workMin, shortMin, longMin, roundsBeforeLong, autoStartNext]);

  // timer loop
  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // stop tick here and handle finish in next effect
          window.clearInterval(tickRef.current || undefined);
          tickRef.current = null;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running]);

  // when timeLeft hits zero
  useEffect(() => {
    if (timeLeft !== 0) return;
    // play sound
    if (!audioRef.current) {
      audioRef.current = new Audio("/data/رنين-المنبه-لشاومي.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

    // change mode
    if (mode === "work") {
      setCompletedRounds((r) => r + 1);
      const nextIsLong = (completedRounds + 1) % roundsBeforeLong === 0;
      setMode(nextIsLong ? "longBreak" : "shortBreak");
      setRunning(autoStartNext);
    } else {
      setMode("work");
      setRunning(autoStartNext);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // keep a stable display time when dialog opens
  useEffect(() => {
    if (!open) {
      // pause on close
      setRunning(false);
      return;
    }
    // ensure time reflects mode
    if (mode === "work") setTimeLeft(workMin * 60);
    if (mode === "shortBreak") setTimeLeft(shortMin * 60);
    if (mode === "longBreak") setTimeLeft(longMin * 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        reset();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, workMin, shortMin, longMin]);

  function start() {
    if (timeLeft <= 0) {
      // restart session length
      if (mode === "work") setTimeLeft(workMin * 60);
      if (mode === "shortBreak") setTimeLeft(shortMin * 60);
      if (mode === "longBreak") setTimeLeft(longMin * 60);
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    if (mode === "work") setTimeLeft(workMin * 60);
    if (mode === "shortBreak") setTimeLeft(shortMin * 60);
    if (mode === "longBreak") setTimeLeft(longMin * 60);
  }

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const total = mode === "work" ? workMin * 60 : mode === "shortBreak" ? shortMin * 60 : longMin * 60;
  const progress = total > 0 ? (1 - timeLeft / total) : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl p-6">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pomodoro Timer</h3>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("work"); reset(); }}
              className={`px-3 py-1 rounded ${mode === "work" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              Work
            </button>
            <button
              onClick={() => { setMode("shortBreak"); reset(); }}
              className={`px-3 py-1 rounded ${mode === "shortBreak" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              Short
            </button>
            <button
              onClick={() => { setMode("longBreak"); reset(); }}
              className={`px-3 py-1 rounded ${mode === "longBreak" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              Long
            </button>
            <button onClick={() => { onClose(); }} className="px-3 py-1 rounded hover:bg-gray-50">Close</button>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* center visual */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-4">
            <div className="relative">
              <svg width="220" height="220" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" strokeWidth="10" stroke="#e6e6e6" fill="none"></circle>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="10"
                  strokeLinecap="round"
                  stroke="currentColor"
                  style={{ strokeDasharray: 314, strokeDashoffset: 314 - progress * 314 }}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" className="text-sm" fontSize={12}>
                  {format(timeLeft)}
                </text>
              </svg>
            </div>

            <div className="flex gap-3">
              {!running ? (
                <button onClick={start} className="px-4 py-2 rounded bg-green-600 text-white">Start</button>
              ) : (
                <button onClick={pause} className="px-4 py-2 rounded bg-yellow-500 text-white">Pause</button>
              )}
              <button onClick={reset} className="px-4 py-2 rounded border">Reset</button>
              <button
                onClick={() => {
                  // skip to end
                  setTimeLeft(0);
                }}
                className="px-4 py-2 rounded border"
              >
                Skip
              </button>
            </div>

            <div className="text-sm text-gray-600">Mode: {mode} · Rounds done: {completedRounds}</div>
          </div>

          {/* settings */}
          <aside className="col-span-1 border-l pl-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs">Work (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={workMin}
                  onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-2 py-1 border rounded"
                />
              </div>

              <div>
                <label className="block text-xs">Short break (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={shortMin}
                  onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-2 py-1 border rounded"
                />
              </div>

              <div>
                <label className="block text-xs">Long break (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={longMin}
                  onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-2 py-1 border rounded"
                />
              </div>

              <div>
                <label className="block text-xs">Rounds before long break</label>
                <input
                  type="number"
                  min={1}
                  value={roundsBeforeLong}
                  onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-2 py-1 border rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <input id="auto" type="checkbox" checked={autoStartNext} onChange={(e) => setAutoStartNext(e.target.checked)} />
                <label htmlFor="auto" className="text-xs">Auto start next</label>
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray-500 mb-1">Presets</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }}
                    className="px-2 py-1 rounded border text-sm"
                  >25/5</button>
                  <button
                    onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }}
                    className="px-2 py-1 rounded border text-sm"
                  >50/10</button>
                  <button
                    onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }}
                    className="px-2 py-1 rounded border text-sm"
                  >60/5</button>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray-500">Shortcuts</div>
                <div className="text-xs text-gray-600">Space: start/pause · R: reset</div>
              </div>

              <div className="pt-2 flex gap-2">
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); }} className="px-2 py-1 rounded border text-sm">Clear saved</button>
                <button onClick={() => { onClose(); }} className="px-2 py-1 rounded bg-gray-100 text-sm">Done</button>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-xs text-gray-500">Tip: اضغط Space للتشغيل/الإيقاف المؤقت. الاحساس العام راقي وخفيف.</footer>
      </div>
    </div>
  );
}
