import React, { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  timeLeft: number;
  running: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  completedRounds: number;
  workMin: number;
  shortMin: number;
  longMin: number;
  roundsBeforeLong: number;
  autoStartNext: boolean;
  setWorkMin: (value: number) => void;
  setShortMin: (value: number) => void;
  setLongMin: (value: number) => void;
  setRoundsBeforeLong: (value: number) => void;
  setAutoStartNext: (value: boolean) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  setTimeLeft: (value: number) => void;
};

export default function PomodoroDialog({
  open,
  onClose,
  timeLeft,
  running,
  mode,
  completedRounds,
  workMin,
  shortMin,
  longMin,
  roundsBeforeLong,
  autoStartNext,
  setWorkMin,
  setShortMin,
  setLongMin,
  setRoundsBeforeLong,
  setAutoStartNext,
  start,
  pause,
  reset,
  skip,
  setMode,
  setTimeLeft,
}: Props) {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open || showSettings) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (running) pause();
        else start();
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        reset();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, showSettings, running, start, pause, reset]);

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const total = mode === 'work' ? workMin * 60 : mode === 'shortBreak' ? shortMin * 60 : longMin * 60;
  const progress = total > 0 ? 1 - timeLeft / total : 0;

  if (!open) return null;

  // CSS-in-JS Styles (unchanged)
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
    },
    dialog: {
      width: '100%',
      maxWidth: '30rem',
      borderRadius: '1.5rem',
      backgroundColor: '#0A192F',
      color: '#fff',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      padding: '2rem',
      border: '1px solid #1f2937',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid #1f2937',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '800',
      color: '#e5e7eb',
      letterSpacing: '-0.025em',
    },
    headerButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    iconButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#9ca3af',
      fontSize: '1.5rem',
      cursor: 'pointer',
      transition: 'color 0.2s',
      outline: 'none',
    },
    backButton: {
      fontSize: '1rem',
      fontWeight: 'bold',
    },
    mainSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
    },
    timerCircleContainer: {
      position: 'relative',
      width: '16rem',
      height: '16rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    timerText: {
      position: 'relative',
      textAlign: 'center',
      color: '#fff',
    },
    timerTime: {
      fontSize: '4rem',
      fontWeight: '300',
      lineHeight: '1',
    },
    timerDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginTop: '0.5rem',
    },
    controlButtonsContainer: {
      display: 'flex',
      gap: '1rem',
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
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    startButton: {
      backgroundColor: '#059669',
      color: '#0A192F',
      border: 'none',
    },
    pauseButton: {
      backgroundColor: '#f59e0b',
      color: '#fff',
      border: 'none',
    },
    settingsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1rem 0',
    },
    settingsTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#e5e7eb',
    },
    settingItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingLabel: {
      fontSize: '0.875rem',
      color: '#d1d5db',
    },
    settingInput: {
      width: '6rem',
      padding: '0.5rem',
      backgroundColor: '#15253F',
      color: '#20C5C3',
      border: '1px solid #374151',
      borderRadius: '0.5rem',
      textAlign: 'right',
      fontSize: '1rem',
      outline: 'none',
    },
    presetsContainer: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '0.5rem',
    },
    presetsButton: {
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      border: '1px solid #374151',
      color: '#9ca3af',
      fontSize: '0.875rem',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      outline: 'none',
    },
    quickActions: {
      marginTop: '1.5rem',
      borderTop: '1px solid #1f2937',
      paddingTop: '1.5rem',
    },
    quickButton: {
      backgroundColor: '#dc2626',
      color: '#fff',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      outline: 'none',
    },
    footer: {
      marginTop: '2rem',
      fontSize: '0.875rem',
      color: '#6b7280',
      textAlign: 'center',
      borderTop: '1px solid #1f2937',
      paddingTop: '1.5rem',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <header style={styles.header}>
          <h3 style={styles.title}>{showSettings ? 'Settings' : 'Pomodoro Timer'}</h3>
          <div style={styles.headerButtons}>
            {!showSettings ? (
              <button onClick={() => setShowSettings(true)} style={styles.iconButton} aria-label="Settings">
                ⚙️
              </button>
            ) : (
              <button onClick={() => setShowSettings(false)} style={{ ...styles.iconButton, ...styles.backButton }}>
                ← Back
              </button>
            )}
            <button onClick={onClose} style={styles.iconButton} aria-label="Close">
              &times;
            </button>
          </div>
        </header>

        {!showSettings ? (
          <main style={styles.mainSection}>
            <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#15253F', padding: '0.5rem', borderRadius: '9999px' }}>
              <button
                onClick={() => {
                  setMode('work');
                  reset();
                }}
                style={{
                  ...styles.controlButton,
                  backgroundColor: mode === 'work' ? '#20C5C3' : 'transparent',
                  color: mode === 'work' ? '#0A192F' : '#9ca3af',
                }}
              >
                Work
              </button>
              <button
                onClick={() => {
                  setMode('shortBreak');
                  reset();
                }}
                style={{
                  ...styles.controlButton,
                  backgroundColor: mode === 'shortBreak' ? '#20C5C3' : 'transparent',
                  color: mode === 'shortBreak' ? '#0A192F' : '#9ca3af',
                }}
              >
                Short
              </button>
              <button
                onClick={() => {
                  setMode('longBreak');
                  reset();
                }}
                style={{
                  ...styles.controlButton,
                  backgroundColor: mode === 'longBreak' ? '#20C5C3' : 'transparent',
                  color: mode === 'longBreak' ? '#0A192F' : '#9ca3af',
                }}
              >
                Long
              </button>
            </div>

            <div style={styles.timerCircleContainer}>
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
                <p style={styles.timerDescription}>{mode === 'work' ? 'Focus Time' : 'Break Time'}</p>
              </div>
            </div>

            <div style={styles.controlButtonsContainer}>
              {!running ? (
                <button onClick={start} style={{ ...styles.controlButton, ...styles.startButton }}>
                  Start
                </button>
              ) : (
                <button onClick={pause} style={{ ...styles.controlButton, ...styles.pauseButton }}>
                  Pause
                </button>
              )}
              <button onClick={reset} style={styles.controlButton}>Reset</button>
              <button onClick={skip} style={styles.controlButton}>Skip</button>
            </div>

            <p style={{ ...styles.timerDescription, marginTop: '1rem' }}>
              Completed Rounds: <span style={{ fontWeight: '600', color: '#5eead4' }}>{completedRounds}</span>
            </p>
          </main>
        ) : (
          <main style={styles.settingsSection}>
            <div>
              <h4 style={styles.settingsTitle}>Timer Settings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={styles.settingItem}>
                  <label htmlFor="workMin" style={styles.settingLabel}>
                    Work Duration (minutes)
                  </label>
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
                  <label htmlFor="shortMin" style={styles.settingLabel}>
                    Short Break (minutes)
                  </label>
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
                  <label htmlFor="longMin" style={styles.settingLabel}>
                    Long Break (minutes)
                  </label>
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
                  <label htmlFor="roundsBeforeLong" style={styles.settingLabel}>
                    Rounds before Long Break
                  </label>
                  <input
                    id="roundsBeforeLong"
                    type="number"
                    min={1}
                    value={roundsBeforeLong}
                    onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))}
                    style={styles.settingInput}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <input
                    id="autoStartNext"
                    type="checkbox"
                    checked={autoStartNext}
                    onChange={(e) => setAutoStartNext(e.target.checked)}
                    style={{ accentColor: '#20C5C3' }}
                  />
                  <label htmlFor="autoStartNext" style={{ ...styles.settingLabel, cursor: 'pointer' }}>
                    Auto start next round
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 style={styles.settingsTitle}>Presets</h4>
              <div style={styles.presetsContainer}>
                <button
                  onClick={() => {
                    setWorkMin(25);
                    setShortMin(5);
                    setLongMin(15);
                  }}
                  style={styles.presetsButton}
                >
                  25/5/15
                </button>
                <button
                  onClick={() => {
                    setWorkMin(50);
                    setShortMin(10);
                    setLongMin(20);
                  }}
                  style={styles.presetsButton}
                >
                  50/10/20
                </button>
                <button
                  onClick={() => {
                    setWorkMin(60);
                    setShortMin(5);
                    setLongMin(15);
                  }}
                  style={styles.presetsButton}
                >
                  60/5/15
                </button>
              </div>
            </div>

            <div style={styles.quickActions}>
              <h4 style={styles.settingsTitle}>Quick Actions</h4>
              <button
                onClick={() => {
                  localStorage.removeItem('planx_pomodoro_v1');
                  alert('Settings cleared!');
                }}
                style={styles.quickButton}
              >
                Clear Saved Settings
              </button>
            </div>
          </main>
        )}

        <footer style={styles.footer}>
          Designed with <span style={{ color: '#ef4444' }}>&hearts;</span> for productivity.
        </footer>
      </div>
    </div>
  );
}
