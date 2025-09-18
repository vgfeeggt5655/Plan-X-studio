import React, { useEffect, useRef, useState } from "react";

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

const STORAGE_KEY = "planx_pomodoro_v1";

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
  const [workMin, setWorkMin] = useState<number>(60);
  const [shortMin, setShortMin] = useState<number>(5);
  const [longMin, setLongMin] = useState<number>(15);
  const [roundsBeforeLong, setRoundsBeforeLong] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [completedRounds, setCompletedRounds] = useState<number>(0);

  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workMin, shortMin, longMin, roundsBeforeLong, autoStartNext })
    );
  }, [workMin, shortMin, longMin, roundsBeforeLong, autoStartNext]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
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
  }, [running, setTimeLeft]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/data/رنين-المنبه-لشاومي.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

    if (mode === "work") {
      setCompletedRounds((r) => r + 1);
      const nextIsLong = (completedRounds + 1) % roundsBeforeLong === 0;
      const nextMode = nextIsLong ? "longBreak" : "shortBreak";
      setMode(nextMode);
      setTimeLeft(nextMode === "longBreak" ? longMin * 60 : shortMin * 60);
      if (!autoStartNext) pause();
    } else {
      setMode("work");
      setTimeLeft(workMin * 60);
      if (!autoStartNext) pause();
    }
  }, [timeLeft, completedRounds, roundsBeforeLong, autoStartNext, mode, setMode, setTimeLeft, workMin, shortMin, longMin, pause]);

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const total = mode === "work" ? workMin * 60 : mode === "shortBreak" ? shortMin * 60 : longMin * 60;
  const progress = total > 0 ? 1 - timeLeft / total : 0;

  if (!open) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)', padding: '1rem', fontFamily: 'sans-serif'
    },
    dialog: {
      width: '100%', maxWidth: '30rem', borderRadius: '1.5rem',
      backgroundColor: '#0A192F', color: '#fff', padding: '2rem', border: '1px solid #1f2937'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    title: { fontSize: '1.5rem', fontWeight: 800 },
    iconButton: { background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem' },
    timerCircleContainer: { position: 'relative', width: '16rem', height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    timerSvg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
    timerText: { position: 'relative', textAlign: 'center' as const },
    timerTime: { fontSize: '4rem', fontWeight: 300 },
    timerDescription: { fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' },
    controlButtonsContainer: { display: 'flex', gap: '1rem' },
    controlButton: { padding: '0.75rem 2rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', border: '1px solid #374151', color: '#d1d5db', background: 'transparent' },
    startButton: { backgroundColor: '#059669', color: '#0A192F', border: 'none' },
    pauseButton: { backgroundColor: '#f59e0b', color: '#fff', border: 'none' }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <header style={styles.header}>
          <h3 style={styles.title}>{showSettings ? "Settings" : "Pomodoro Timer"}</h3>
          <div>
            {!showSettings ? (
              <button style={styles.iconButton} onClick={() => setShowSettings(true)}>⚙️</button>
            ) : (
              <button style={styles.iconButton} onClick={() => setShowSettings(false)}>←</button>
            )}
            <button style={styles.iconButton} onClick={onClose}>×</button>
          </div>
        </header>

        {!showSettings ? (
          <main>
            <div style={styles.timerCircleContainer}>
              <svg style={styles.timerSvg} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="#1F2A40" strokeWidth="8" fill="none" />
                <circle
                  cx="60" cy="60" r="54" stroke="#20C5C3" strokeWidth="8" strokeLinecap="round"
                  style={{ strokeDasharray: 339.292, strokeDashoffset: 339.292 - progress * 339.292, transition: 'stroke-dashoffset 1s linear' }}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div style={styles.timerText}>
                <p style={styles.timerTime}>{format(timeLeft)}</p>
                <p style={styles.timerDescription}>{mode === "work" ? "Focus Time" : "Break Time"}</p>
              </div>
            </div>

            <div style={styles.controlButtonsContainer}>
              {!running ? (
                <button onClick={start} style={{ ...styles.controlButton, ...styles.startButton }}>Start</button>
              ) : (
                <button onClick={pause} style={{ ...styles.controlButton, ...styles.pauseButton }}>Pause</button>
              )}
              <button onClick={reset} style={styles.controlButton}>Reset</button>
            </div>
            <p style={{ ...styles.timerDescription, marginTop: '1rem' }}>Completed Rounds: {completedRounds}</p>
          </main>
        ) : (
          <main>
            <h4>Settings</h4>
            {/* هنا ممكن تضيف الإعدادات */}
          </main>
        )}
      </div>
    </div>
  );
}
