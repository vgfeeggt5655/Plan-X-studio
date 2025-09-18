import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "work" | "shortBreak" | "longBreak";

const STORAGE_KEY = "planx_pomodoro_v1";

export default function PomodoroDialog({ open, onClose }: Props) {
  // default settings
  const [workMin, setWorkMin] = useState<number>(60);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0A192F] text-white shadow-2xl p-6 border border-gray-700/50">
        <header className="flex items-center justify-between border-b border-gray-700/50 pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-200">Pomodoro Timer ⏱️</h3>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("work"); reset(); }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === "work" ? "bg-teal-500 text-[#0A192F]" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Work
            </button>
            <button
              onClick={() => { setMode("shortBreak"); reset(); }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === "shortBreak" ? "bg-teal-500 text-[#0A192F]" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Short
            </button>
            <button
              onClick={() => { setMode("longBreak"); reset(); }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === "longBreak" ? "bg-teal-500 text-[#0A192F]" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Long
            </button>
            <button onClick={() => { onClose(); }} className="px-3 py-1 rounded-full bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors text-sm">Close</button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* center visual */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-6">
            <div className="relative">
              <svg width="220" height="220" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" strokeWidth="8" stroke="#1F2A40" fill="none"></circle>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="#20C5C3"
                  style={{ strokeDasharray: 314, strokeDashoffset: 314 - progress * 314 }}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-light text-white" fill="currentColor">
                  {format(timeLeft)}
                </text>
              </svg>
            </div>

            <div className="flex gap-4">
              {!running ? (
                <button onClick={start} className="px-6 py-2 rounded-full font-semibold bg-teal-500 text-[#0A192F] hover:bg-teal-400 transition-colors transform hover:scale-105">Start</button>
              ) : (
                <button onClick={pause} className="px-6 py-2 rounded-full font-semibold bg-orange-500 text-white hover:bg-orange-400 transition-colors transform hover:scale-105">Pause</button>
              )}
              <button onClick={reset} className="px-6 py-2 rounded-full border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors">Reset</button>
              <button
                onClick={() => {
                  // skip to end
                  setTimeLeft(0);
                }}
                className="px-6 py-2 rounded-full border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors"
              >
                Skip
              </button>
            </div>

            <div className="text-sm text-gray-400 mt-2">Mode: **{mode}** · Rounds done: **{completedRounds}**</div>
          </div>

          {/* settings */}
          <aside className="col-span-1 border-l border-gray-700/50 pl-4">
            <div className="space-y-4">
              <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">Settings</div>
              <div>
                <label className="block text-xs text-gray-400">Work (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={workMin}
                  onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-3 py-1 bg-[#1F2A40] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400">Short break (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={shortMin}
                  onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-3 py-1 bg-[#1F2A40] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400">Long break (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={longMin}
                  onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-3 py-1 bg-[#1F2A40] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400">Rounds before long break</label>
                <input
                  type="number"
                  min={1}
                  value={roundsBeforeLong}
                  onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-1 px-3 py-1 bg-[#1F2A40] text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input id="auto" type="checkbox" checked={autoStartNext} onChange={(e) => setAutoStartNext(e.target.checked)} className="form-checkbox text-teal-500 bg-[#1F2A40] border-gray-700 rounded" />
                <label htmlFor="auto" className="text-xs text-gray-300 select-none">Auto start next</label>
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">Presets</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }}
                    className="px-3 py-1 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-500 transition-colors"
                  >25/5</button>
                  <button
                    onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }}
                    className="px-3 py-1 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-500 transition-colors"
                  >50/10</button>
                  <button
                    onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }}
                    className="px-3 py-1 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-500 transition-colors"
                  >60/5</button>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Shortcuts</div>
                <div className="text-xs text-gray-400 mt-1">
                  <span className="bg-gray-700 px-2 py-0.5 rounded-md font-mono text-gray-200">Space</span>: start/pause
                  <span className="bg-gray-700 px-2 py-0.5 rounded-md font-mono text-gray-200 ml-2">R</span>: reset
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-xs text-gray-500 text-center border-t border-gray-700/50 pt-4">
          Tip: اضغط Space للتشغيل/الإيقاف المؤقت.
        </footer>
      </div>
    </div>
  );
}
