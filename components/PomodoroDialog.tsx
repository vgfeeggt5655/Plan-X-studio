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

  // CSS-in-JS Styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '1rem',
      fontFamily: 'sans-serif',
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased'
    },
    dialog: {
      width: '100%',
      maxWidth: '60rem',
      borderRadius: '1.5rem',
      backgroundColor: '#0A192F',
      color: '#fff',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      padding: '2rem',
      border: '1px solid #1f2937'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid #1f2937',
      marginBottom: '1.5rem'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: '800',
      color: '#e5e7eb',
      letterSpacing: '-0.025em'
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#9ca3af',
      fontSize: '2rem',
      cursor: 'pointer',
      transition: 'color 0.2s',
      outline: 'none',
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '2.5rem',
      alignItems: 'flex-start',
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      borderRadius: '1rem',
      backgroundColor: '#15253F',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      border: '1px solid #374151'
    },
    modeButtonsContainer: {
      display: 'flex',
      gap: '0.75rem',
      backgroundColor: '#0A192F',
      padding: '0.5rem',
      borderRadius: '9999px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    button: {
      padding: '0.5rem 1.25rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
    },
    modeButtonActive: {
      backgroundColor: '#20C5C3',
      color: '#0A192F',
      boxShadow: '0 10px 15px -3px rgba(32, 197, 195, 0.3), 0 4px 6px -2px rgba(32, 197, 195, 0.1)'
    },
    modeButtonInactive: {
      color: '#9ca3af',
      backgroundColor: 'transparent',
    },
    timerCircleContainer: {
      position: 'relative',
      width: '16rem',
      height: '16rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    timerSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    },
    timerText: {
      position: 'relative',
      textAlign: 'center',
      color: '#fff'
    },
    timerTime: {
      fontSize: '4rem',
      fontWeight: '300',
      lineHeight: '1'
    },
    timerDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginTop: '0.5rem'
    },
    controlButtonsContainer: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    controlButton: {
      padding: '0.75rem 2rem',
      borderRadius: '9999px',
      fontWeight: '700',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: '1px solid #374151',
      color: '#d1d5db',
      backgroundColor: 'transparent',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      outline: 'none'
    },
    startButton: {
      backgroundColor: '#059669',
      color: '#0A192F',
      border: 'none',
      boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3), 0 4px 6px -2px rgba(5, 150, 105, 0.1)',
    },
    pauseButton: {
      backgroundColor: '#f59e0b',
      color: '#fff',
      border: 'none',
      boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.1)',
    },
    settingsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '2rem',
      borderRadius: '1rem',
      backgroundColor: '#15253F',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      border: '1px solid #374151'
    },
    settingsTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#e5e7eb',
      marginBottom: '1rem'
    },
    settingItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    settingLabel: {
      fontSize: '0.875rem',
      color: '#d1d5db'
    },
    settingInput: {
      width: '6rem',
      padding: '0.25rem 0.75rem',
      backgroundColor: '#0A192F',
      color: '#20C5C3',
      border: '1px solid #374151',
      borderRadius: '0.5rem',
      textAlign: 'right',
      fontSize: '1.125rem',
      fontFamily: 'monospace',
      outline: 'none',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      paddingTop: '0.5rem',
    },
    checkbox: {
      height: '1.25rem',
      width: '1.25rem',
      color: '#20C5C3',
      backgroundColor: '#0A192F',
      border: '1px solid #374151',
      borderRadius: '0.25rem',
      outline: 'none',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '0.875rem',
      color: '#d1d5db',
      cursor: 'pointer',
      userSelect: 'none',
    },
    presetsContainer: {
      display: 'flex',
      gap: '0.75rem',
    },
    presetsButton: {
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      border: '1px solid #374151',
      color: '#9ca3af',
      fontSize: '0.875rem',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      outline: 'none'
    },
    shortcutsContainer: {
      paddingTop: '0.5rem',
      textAlign: 'center',
      borderTop: '1px solid #1f2937',
      padding: '1.5rem 0'
    },
    shortcutTitle: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '0.5rem'
    },
    shortcutText: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    shortcutKey: {
      backgroundColor: '#374151',
      padding: '0.25rem 0.625rem',
      borderRadius: '0.375rem',
      fontFamily: 'monospace',
      color: '#e5e7eb',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    footer: {
      marginTop: '2rem',
      fontSize: '0.875rem',
      color: '#6b7280',
      textAlign: 'center',
      borderTop: '1px solid #1f2937',
      paddingTop: '1.5rem'
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <header style={styles.header}>
          <h3 style={styles.title}>Pomodoro Timer</h3>
          <button
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <main style={{...styles.mainGrid, '@media (min-width: 1024px)': {gridTemplateColumns: '1fr 1fr'}}}>
          {/* Main Timer Section */}
          <section style={styles.section}>
            <div style={styles.modeButtonsContainer}>
              <button
                onClick={() => { setMode("work"); reset(); }}
                style={{
                  ...styles.button,
                  ...(mode === "work" ? styles.modeButtonActive : styles.modeButtonInactive)
                }}
              >
                Work
              </button>
              <button
                onClick={() => { setMode("shortBreak"); reset(); }}
                style={{
                  ...styles.button,
                  ...(mode === "shortBreak" ? styles.modeButtonActive : styles.modeButtonInactive)
                }}
              >
                Short Break
              </button>
              <button
                onClick={() => { setMode("longBreak"); reset(); }}
                style={{
                  ...styles.button,
                  ...(mode === "longBreak" ? styles.modeButtonActive : styles.modeButtonInactive)
                }}
              >
                Long Break
              </button>
            </div>

            <div style={{...styles.timerCircleContainer, marginTop: '2rem'}}>
              <svg style={styles.timerSvg} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" strokeWidth="8" stroke="#1F2A40" fill="none"></circle>
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="#20C5C3"
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
                <button onClick={start} style={{...styles.controlButton, ...styles.startButton}}>Start</button>
              ) : (
                <button onClick={pause} style={{...styles.controlButton, ...styles.pauseButton}}>Pause</button>
              )}
              <button onClick={reset} style={styles.controlButton}>Reset</button>
              <button onClick={() => setTimeLeft(0)} style={styles.controlButton}>Skip</button>
            </div>

            <p style={{...styles.timerDescription, marginTop: '1rem'}}>
              Completed Rounds: <span style={{fontWeight: '600', color: '#5eead4'}}>{completedRounds}</span>
            </p>
          </section>

          {/* Settings Section */}
          <aside style={styles.settingsSection}>
            <div>
              <h4 style={styles.settingsTitle}>Timer Settings</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={styles.settingItem}>
                  <label htmlFor="workMin" style={styles.settingLabel}>Work Duration (minutes)</label>
                  <input
                    id="workMin"
                    type="number"
                    min={1}
                    value={workMin}
                    onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))}
                    style={styles.settingInput}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="shortMin" style={styles.settingLabel}>Short Break (minutes)</label>
                  <input
                    id="shortMin"
                    type="number"
                    min={1}
                    value={shortMin}
                    onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))}
                    style={styles.settingInput}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="longMin" style={styles.settingLabel}>Long Break (minutes)</label>
                  <input
                    id="longMin"
                    type="number"
                    min={1}
                    value={longMin}
                    onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))}
                    style={styles.settingInput}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="roundsBeforeLong" style={styles.settingLabel}>Rounds before Long Break</label>
                  <input
                    id="roundsBeforeLong"
                    type="number"
                    min={1}
                    value={roundsBeforeLong}
                    onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                    style={styles.settingInput}
                  />
                </div>
                <div style={styles.checkboxContainer}>
                  <input
                    id="autoStartNext"
                    type="checkbox"
                    checked={autoStartNext}
                    onChange={(e) => setAutoStartNext(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <label htmlFor="autoStartNext" style={styles.checkboxLabel}>Auto start next round</label>
                </div>
              </div>
            </div>

            <div>
              <h4 style={styles.settingsTitle}>Presets</h4>
              <div style={styles.presetsContainer}>
                <button onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }} style={styles.presetsButton}>25/5/15</button>
                <button onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }} style={styles.presetsButton}>50/10/20</button>
                <button onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }} style={styles.presetsButton}>60/5/15</button>
              </div>
            </div>

            <div>
              <h4 style={styles.settingsTitle}>Quick Actions</h4>
              <button
                onClick={() => { localStorage.removeItem(STORAGE_KEY); alert('Settings cleared!'); }}
                style={{...styles.button, padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}
              >
                Clear Saved Settings
              </button>
            </div>

            <div style={styles.shortcutsContainer}>
              <div style={styles.shortcutTitle}>Keyboard Shortcuts</div>
              <div style={styles.shortcutText}>
                <span style={styles.shortcutKey}>Space</span>: Start/Pause
                <span style={styles.shortcutKey}>R</span>: Reset Timer
              </div>
            </div>
          </aside>
        </main>

        <footer style={styles.footer}>
          Designed with <span style={{color: '#ef4444'}}>&hearts;</span> for productivity.
        </footer>
      </div>
    </div>
  );
}
