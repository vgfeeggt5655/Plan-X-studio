import React, { useEffect, useRef } from "react";

type Props = {
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
};

export default function PomodoroDialog({
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
}: Props) {
  if (!open) return null;

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    }}>
      <div style={{ width: '300px', backgroundColor: '#0A192F', color: '#fff', padding: '2rem', borderRadius: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Pomodoro Timer</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff' }}>&times;</button>
        </header>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p style={{ fontSize: '3rem' }}>{format(timeLeft)}</p>
          <p>{mode === "work" ? "Focus Time" : "Break Time"}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {!running ? (
            <button onClick={start}>Start</button>
          ) : (
            <button onClick={pause}>Pause</button>
          )}
          <button onClick={reset}>Reset</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={() => setMode("work")}>Work</button>
          <button onClick={() => setMode("shortBreak")}>Short</button>
          <button onClick={() => setMode("longBreak")}>Long</button>
        </div>
      </div>
    </div>
  );
}
