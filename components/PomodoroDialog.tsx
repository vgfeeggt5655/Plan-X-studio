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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans antialiased">
      <div className="w-full max-w-4xl rounded-3xl bg-[#0A192F] text-white shadow-xl p-8 border border-gray-800">
        <header className="flex items-center justify-between pb-6 border-b border-gray-800 mb-6">
          <h3 className="text-3xl font-extrabold text-gray-100 tracking-tight">Pomodoro Timer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-teal-400 transition-colors text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Main Timer Section */}
          <section className="flex flex-col items-center justify-center space-y-8 bg-[#15253F] p-8 rounded-2xl shadow-inner border border-gray-700">
            {/* Mode selection buttons */}
            <div className="flex gap-3 bg-[#0A192F] p-2 rounded-full shadow-md">
              <button
                onClick={() => { setMode("work"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "work" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Work
              </button>
              <button
                onClick={() => { setMode("shortBreak"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "shortBreak" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Short Break
              </button>
              <button
                onClick={() => { setMode("longBreak"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "longBreak" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Long Break
              </button>
            </div>

            {/* Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" strokeWidth="8" stroke="#1F2A40" fill="none"></circle>
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="#20C5C3"
                  style={{ strokeDasharray: 339.292, strokeDashoffset: 339.292 - progress * 339.292 }}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="relative text-center">
                <p className="text-6xl font-light text-white leading-none">{format(timeLeft)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {mode === "work" ? "Focus Time" : "Break Time"}
                </p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 mt-6">
              {!running ? (
                <button onClick={start} className="px-8 py-3 rounded-full font-bold bg-teal-600 text-[#0A192F] hover:bg-teal-500 transition-colors transform hover:scale-105 shadow-lg">Start</button>
              ) : (
                <button onClick={pause} className="px-8 py-3 rounded-full font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors transform hover:scale-105 shadow-lg">Pause</button>
              )}
              <button onClick={reset} className="px-8 py-3 rounded-full border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors shadow-md">Reset</button>
              <button
                onClick={() => setTimeLeft(0)}
                className="px-8 py-3 rounded-full border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors shadow-md"
              >
                Skip
              </button>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Completed Rounds: <span className="font-semibold text-teal-400">{completedRounds}</span>
            </p>
          </section>

          {/* Settings Section */}
          <aside className="flex flex-col gap-8 bg-[#15253F] p-8 rounded-2xl shadow-inner border border-gray-700">
            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Timer Settings</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="workMin" className="text-sm text-gray-300">Work Duration (minutes)</label>
                  <input
                    id="workMin"
                    type="number"
                    min={1}
                    value={workMin}
                    onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="shortMin" className="text-sm text-gray-300">Short Break (minutes)</label>
                  <input
                    id="shortMin"
                    type="number"
                    min={1}
                    value={shortMin}
                    onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="longMin" className="text-sm text-gray-300">Long Break (minutes)</label>
                  <input
                    id="longMin"
                    type="number"
                    min={1}
                    value={longMin}
                    onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="roundsBeforeLong" className="text-sm text-gray-300">Rounds before Long Break</label>
                  <input
                    id="roundsBeforeLong"
                    type="number"
                    min={1}
                    value={roundsBeforeLong}
                    onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="autoStartNext"
                    type="checkbox"
                    checked={autoStartNext}
                    onChange={(e) => setAutoStartNext(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-teal-500 bg-[#0A192F] border-gray-700 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="autoStartNext" className="text-sm text-gray-300 cursor-pointer select-none">Auto start next round</label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Presets</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >25/5/15</button>
                <button
                  onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >50/10/20</button>
                <button
                  onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >60/5/15</button>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Quick Actions</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => { localStorage.removeItem(STORAGE_KEY); alert('Settings cleared!'); }}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-500 transition-colors shadow-md"
                >Clear Saved Settings</button>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-gray-800 pt-6">
              <div className="text-sm text-gray-500 font-medium mb-2">Keyboard Shortcuts</div>
              <div className="text-xs text-gray-400 space-x-2">
                <span className="bg-gray-700 px-2.5 py-1 rounded-md font-mono text-gray-200 shadow-inner">Space</span>: Start/Pause
                <span className="bg-gray-700 px-2.5 py-1 rounded-md font-mono text-gray-200 shadow-inner">R</span>: Reset Timer
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-sm text-gray-500 text-center border-t border-gray-800 pt-6">
          Designed with <span className="text-red-500">&hearts;</span> for productivity.
        </footer>
      </div>
    </div>
  );
}import React, { useEffect, useRef, useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans antialiased">
      <div className="w-full max-w-4xl rounded-3xl bg-[#0A192F] text-white shadow-xl p-8 border border-gray-800">
        <header className="flex items-center justify-between pb-6 border-b border-gray-800 mb-6">
          <h3 className="text-3xl font-extrabold text-gray-100 tracking-tight">Pomodoro Timer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-teal-400 transition-colors text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Main Timer Section */}
          <section className="flex flex-col items-center justify-center space-y-8 bg-[#15253F] p-8 rounded-2xl shadow-inner border border-gray-700">
            {/* Mode selection buttons */}
            <div className="flex gap-3 bg-[#0A192F] p-2 rounded-full shadow-md">
              <button
                onClick={() => { setMode("work"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "work" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Work
              </button>
              <button
                onClick={() => { setMode("shortBreak"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "shortBreak" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Short Break
              </button>
              <button
                onClick={() => { setMode("longBreak"); reset(); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${mode === "longBreak" ? "bg-teal-500 text-[#0A192F] shadow-lg" : "text-gray-400 hover:text-gray-200"}`}
              >
                Long Break
              </button>
            </div>

            {/* Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" strokeWidth="8" stroke="#1F2A40" fill="none"></circle>
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="#20C5C3"
                  style={{ strokeDasharray: 339.292, strokeDashoffset: 339.292 - progress * 339.292 }}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="relative text-center">
                <p className="text-6xl font-light text-white leading-none">{format(timeLeft)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {mode === "work" ? "Focus Time" : "Break Time"}
                </p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 mt-6">
              {!running ? (
                <button onClick={start} className="px-8 py-3 rounded-full font-bold bg-teal-600 text-[#0A192F] hover:bg-teal-500 transition-colors transform hover:scale-105 shadow-lg">Start</button>
              ) : (
                <button onClick={pause} className="px-8 py-3 rounded-full font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors transform hover:scale-105 shadow-lg">Pause</button>
              )}
              <button onClick={reset} className="px-8 py-3 rounded-full border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors shadow-md">Reset</button>
              <button
                onClick={() => setTimeLeft(0)}
                className="px-8 py-3 rounded-full border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors shadow-md"
              >
                Skip
              </button>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Completed Rounds: <span className="font-semibold text-teal-400">{completedRounds}</span>
            </p>
          </section>

          {/* Settings Section */}
          <aside className="flex flex-col gap-8 bg-[#15253F] p-8 rounded-2xl shadow-inner border border-gray-700">
            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Timer Settings</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="workMin" className="text-sm text-gray-300">Work Duration (minutes)</label>
                  <input
                    id="workMin"
                    type="number"
                    min={1}
                    value={workMin}
                    onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="shortMin" className="text-sm text-gray-300">Short Break (minutes)</label>
                  <input
                    id="shortMin"
                    type="number"
                    min={1}
                    value={shortMin}
                    onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="longMin" className="text-sm text-gray-300">Long Break (minutes)</label>
                  <input
                    id="longMin"
                    type="number"
                    min={1}
                    value={longMin}
                    onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label htmlFor="roundsBeforeLong" className="text-sm text-gray-300">Rounds before Long Break</label>
                  <input
                    id="roundsBeforeLong"
                    type="number"
                    min={1}
                    value={roundsBeforeLong}
                    onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1 bg-[#0A192F] text-teal-400 border border-gray-700 rounded-lg focus:outline-none focus:border-teal-500 text-right text-lg font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="autoStartNext"
                    type="checkbox"
                    checked={autoStartNext}
                    onChange={(e) => setAutoStartNext(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-teal-500 bg-[#0A192F] border-gray-700 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="autoStartNext" className="text-sm text-gray-300 cursor-pointer select-none">Auto start next round</label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Presets</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >25/5/15</button>
                <button
                  onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >50/10/20</button>
                <button
                  onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }}
                  className="px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm hover:border-teal-500 hover:text-teal-400 transition-colors shadow-sm"
                >60/5/15</button>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-200 mb-4">Quick Actions</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => { localStorage.removeItem(STORAGE_KEY); alert('Settings cleared!'); }}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-500 transition-colors shadow-md"
                >Clear Saved Settings</button>
              </div>
            </div>

            <div className="pt-2 text-center border-t border-gray-800 pt-6">
              <div className="text-sm text-gray-500 font-medium mb-2">Keyboard Shortcuts</div>
              <div className="text-xs text-gray-400 space-x-2">
                <span className="bg-gray-700 px-2.5 py-1 rounded-md font-mono text-gray-200 shadow-inner">Space</span>: Start/Pause
                <span className="bg-gray-700 px-2.5 py-1 rounded-md font-mono text-gray-200 shadow-inner">R</span>: Reset Timer
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-sm text-gray-500 text-center border-t border-gray-800 pt-6">
          Designed with <span className="text-red-500">&hearts;</span> for productivity.
        </footer>
      </div>
    </div>
  );
}
