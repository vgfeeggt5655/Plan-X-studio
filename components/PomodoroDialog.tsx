import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "work" | "shortBreak" | "longBreak";

export default function PomodoroDialog({ open, onClose }: Props) {
  // default settings
  const [workMin, setWorkMin] = useState<number>(60);
  const [shortMin, setShortMin] = useState<number>(5);
  const [longMin, setLongMin] = useState<number>(15);
  const [roundsBeforeLong, setRoundsBeforeLong] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // runtime state
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState<number>(workMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [completedRounds, setCompletedRounds] = useState<number>(0);

  const tickRef = useRef<number | null>(null);
  
  // Memory storage for settings
  const settingsData = useRef({ workMin: 60, shortMin: 5, longMin: 15, roundsBeforeLong: 4, autoStartNext: false });
  
  useEffect(() => {
    // Initialize from memory storage
    const saved = settingsData.current;
    setWorkMin(saved.workMin);
    setShortMin(saved.shortMin);
    setLongMin(saved.longMin);
    setRoundsBeforeLong(saved.roundsBeforeLong);
    setAutoStartNext(saved.autoStartNext);
  }, []);

  useEffect(() => {
    // update timeLeft when settings or mode changes
    if (!running) { // Only update if not running
      if (mode === "work") setTimeLeft(workMin * 60);
      if (mode === "shortBreak") setTimeLeft(shortMin * 60);
      if (mode === "longBreak") setTimeLeft(longMin * 60);
    }
  }, [mode, workMin, shortMin, longMin, running]);

  useEffect(() => {
    // Save to memory storage
    settingsData.current = { workMin, shortMin, longMin, roundsBeforeLong, autoStartNext };
  }, [workMin, shortMin, longMin, roundsBeforeLong, autoStartNext]);

  // timer loop
  useEffect(() => {
    if (!running) return;
    
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false); // Stop the timer
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

  // when timeLeft hits zero - Fixed audio issue
  useEffect(() => {
    if (timeLeft !== 0) return;
    
    // Play notification sound using Web Audio API
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz frequency
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      // Play multiple beeps
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(600, audioContext.currentTime);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.8);
      }, 200);
      
    } catch (error) {
      console.log("Audio notification not supported:", error);
    }

    if (mode === "work") {
      const newCompletedRounds = completedRounds + 1;
      setCompletedRounds(newCompletedRounds);
      const nextIsLong = newCompletedRounds % roundsBeforeLong === 0;
      setMode(nextIsLong ? "longBreak" : "shortBreak");
    } else {
      setMode("work");
    }
    
    // Set running state based on auto start setting
    setRunning(autoStartNext);
  }, [timeLeft, mode, completedRounds, roundsBeforeLong, autoStartNext]);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setShowSettings(false);
      return;
    }
    // Reset timer when dialog opens
    if (mode === "work") setTimeLeft(workMin * 60);
    if (mode === "shortBreak") setTimeLeft(shortMin * 60);
    if (mode === "longBreak") setTimeLeft(longMin * 60);
  }, [open, workMin, shortMin, longMin, mode]);

  // keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open || showSettings) return;
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
  }, [open, showSettings, mode, workMin, shortMin, longMin]);

  function start() {
    if (timeLeft <= 0) {
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

  // Enhanced CSS-in-JS Styles
  const styles = {
    overlay: {
      position: 'fixed' as const, 
      top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 50,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      padding: '1rem', 
      fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
      backdropFilter: 'blur(8px)'
    },
    dialog: {
      width: '100%', 
      maxWidth: '32rem', 
      borderRadius: '2rem',
      backgroundColor: '#0A192F', 
      color: '#fff', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      padding: '2.5rem', 
      border: '1px solid rgba(31, 41, 55, 0.8)',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    glowEffect: {
      position: 'absolute' as const,
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(32, 197, 195, 0.05) 0%, transparent 70%)',
      pointerEvents: 'none' as const
    },
    header: {
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingBottom: '2rem', 
      borderBottom: '1px solid rgba(31, 41, 55, 0.6)', 
      marginBottom: '2rem',
      position: 'relative' as const,
      zIndex: 1
    },
    title: {
      fontSize: '1.75rem', 
      fontWeight: '800', 
      color: '#f8fafc', 
      letterSpacing: '-0.025em',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    headerButtons: {
      display: 'flex', 
      gap: '0.75rem'
    },
    iconButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#cbd5e1',
      fontSize: '1.25rem', 
      cursor: 'pointer', 
      transition: 'all 0.3s ease', 
      outline: 'none',
      borderRadius: '0.75rem',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '2.5rem',
      minHeight: '2.5rem',
      backdropFilter: 'blur(10px)'
    },
    backButton: {
      fontSize: '0.875rem', 
      fontWeight: 'bold',
      padding: '0.75rem 1rem'
    },
    mainSection: {
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center', 
      gap: '2.5rem',
      position: 'relative' as const,
      zIndex: 1
    },
    modeSelector: {
      display: 'flex', 
      gap: '0.5rem', 
      backgroundColor: 'rgba(21, 37, 63, 0.8)', 
      padding: '0.5rem', 
      borderRadius: '1.25rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    modeButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '1rem',
      border: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      outline: 'none',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    timerCircleContainer: {
      position: 'relative' as const, 
      width: '18rem', 
      height: '18rem',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center'
    },
    timerSvg: {
      position: 'absolute' as const, 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      filter: 'drop-shadow(0 0 20px rgba(32, 197, 195, 0.3))'
    },
    timerText: {
      position: 'relative' as const, 
      textAlign: 'center' as const, 
      color: '#fff',
      zIndex: 2
    },
    timerTime: {
      fontSize: '4.5rem', 
      fontWeight: '200', 
      lineHeight: '1',
      fontFamily: '"SF Mono", "Monaco", monospace',
      letterSpacing: '-0.05em',
      background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    timerDescription: {
      fontSize: '1rem', 
      color: '#94a3b8', 
      marginTop: '0.75rem',
      fontWeight: '500',
      letterSpacing: '0.025em'
    },
    controlButtonsContainer: {
      display: 'flex', 
      gap: '1rem',
      flexWrap: 'wrap' as const,
      justifyContent: 'center'
    },
    controlButton: {
      padding: '1rem 2rem', 
      borderRadius: '1.25rem', 
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.3s ease', 
      cursor: 'pointer', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#e2e8f0', 
      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
      boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      position: 'relative' as const,
      overflow: 'hidden',
      minWidth: '6rem',
      outline: 'none'
    },
    startButton: {
      backgroundColor: 'rgba(5, 150, 105, 0.2)', 
      color: '#6ee7b7',
      border: '1px solid rgba(5, 150, 105, 0.3)',
      boxShadow: '0 4px 15px -3px rgba(5, 150, 105, 0.4)'
    },
    pauseButton: {
      backgroundColor: 'rgba(245, 158, 11, 0.2)', 
      color: '#fbbf24',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      boxShadow: '0 4px 15px -3px rgba(245, 158, 11, 0.4)'
    },
    settingsSection: {
      display: 'flex', 
      flexDirection: 'column' as const, 
      gap: '2rem',
      padding: '1rem 0',
      position: 'relative' as const,
      zIndex: 1
    },
    settingsTitle: {
      fontSize: '1.375rem', 
      fontWeight: '700', 
      color: '#f1f5f9',
      marginBottom: '1rem'
    },
    settingItem: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    settingLabel: {
      fontSize: '0.925rem', 
      color: '#cbd5e1',
      fontWeight: '500'
    },
    settingInput: {
      width: '7rem', 
      padding: '0.75rem 1rem', 
      backgroundColor: 'rgba(21, 37, 63, 0.8)',
      color: '#20C5C3', 
      border: '1px solid rgba(32, 197, 195, 0.3)', 
      borderRadius: '0.75rem',
      textAlign: 'right' as const, 
      fontSize: '1rem', 
      outline: 'none',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    presetsContainer: {
      display: 'flex', 
      gap: '0.75rem', 
      marginTop: '1rem',
      flexWrap: 'wrap' as const
    },
    presetsButton: {
      padding: '0.75rem 1.25rem', 
      borderRadius: '1rem', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#94a3b8', 
      fontSize: '0.875rem', 
      cursor: 'pointer',
      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
      outline: 'none',
      transition: 'all 0.3s ease',
      fontWeight: '500'
    },
    checkboxContainer: {
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      marginTop: '0.5rem'
    },
    checkbox: {
      width: '1.25rem',
      height: '1.25rem',
      accentColor: '#20C5C3'
    },
    quickActions: {
      marginTop: '1rem',
      borderTop: '1px solid rgba(31, 41, 55, 0.6)', 
      paddingTop: '2rem'
    },
    quickButton: {
      backgroundColor: 'rgba(220, 38, 38, 0.2)', 
      color: '#fca5a5', 
      padding: '0.75rem 1.5rem',
      borderRadius: '1rem', 
      border: '1px solid rgba(220, 38, 38, 0.3)', 
      cursor: 'pointer', 
      outline: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    footer: {
      marginTop: '2.5rem', 
      fontSize: '0.875rem', 
      color: '#64748b', 
      textAlign: 'center' as const,
      borderTop: '1px solid rgba(31, 41, 55, 0.6)', 
      paddingTop: '2rem',
      position: 'relative' as const,
      zIndex: 1
    },
    completedRounds: {
      fontSize: '1rem',
      color: '#94a3b8',
      textAlign: 'center' as const,
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.glowEffect}></div>
        
        <header style={styles.header}>
          <h3 style={styles.title}>{showSettings ? "Settings" : "Pomodoro Timer"}</h3>
          <div style={styles.headerButtons}>
            {!showSettings ? (
              <button
                onClick={() => setShowSettings(true)}
                style={styles.iconButton}
                aria-label="Settings"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ⚙️
              </button>
            ) : (
              <button
                onClick={() => setShowSettings(false)}
                style={{...styles.iconButton, ...styles.backButton}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back
              </button>
            )}
            <button 
              onClick={onClose} 
              style={styles.iconButton} 
              aria-label="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                e.currentTarget.style.color = '#fca5a5';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {!showSettings ? (
          <main style={styles.mainSection}>
            <div style={styles.modeSelector}>
              {(['work', 'shortBreak', 'longBreak'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); reset(); }}
                  style={{
                    ...styles.modeButton,
                    backgroundColor: mode === m ? '#20C5C3' : 'transparent',
                    color: mode === m ? '#0A192F' : '#94a3b8',
                    boxShadow: mode === m ? '0 4px 15px -3px rgba(32, 197, 195, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (mode !== m) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== m) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {m === 'work' ? 'Work' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>
            
            <div style={styles.timerCircleContainer}>
              <svg style={styles.timerSvg} viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#20C5C3', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#0891b2', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" strokeWidth="6" stroke="rgba(31, 42, 64, 0.8)" fill="none"></circle>
                <circle
                  cx="60" cy="60" r="54" strokeWidth="6" strokeLinecap="round" 
                  stroke="url(#progressGradient)"
                  style={{ 
                    strokeDasharray: 339.292, 
                    strokeDashoffset: 339.292 - progress * 339.292, 
                    transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div style={styles.timerText}>
                <p style={styles.timerTime}>{format(timeLeft)}</p>
                <p style={styles.timerDescription}>
                  {mode === "work" ? "🎯 Focus Time" : mode === "shortBreak" ? "☕ Short Break" : "🌟 Long Break"}
                </p>
              </div>
            </div>

            <div style={styles.controlButtonsContainer}>
              {!running ? (
                <button 
                  onClick={start} 
                  style={{...styles.controlButton, ...styles.startButton}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px -5px rgba(5, 150, 105, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(5, 150, 105, 0.4)';
                  }}
                >
                  ▶ Start
                </button>
              ) : (
                <button 
                  onClick={pause} 
                  style={{...styles.controlButton, ...styles.pauseButton}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px -5px rgba(245, 158, 11, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(245, 158, 11, 0.4)';
                  }}
                >
                  ⏸ Pause
                </button>
              )}
              <button 
                onClick={reset} 
                style={styles.controlButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                🔄 Reset
              </button>
              <button 
                onClick={() => setTimeLeft(0)} 
                style={styles.controlButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                ⏭ Skip
              </button>
            </div>

            <div style={styles.completedRounds}>
              <span style={{color: '#94a3b8'}}>Completed Rounds: </span>
              <span style={{fontWeight: '700', color: '#5eead4', fontSize: '1.125rem'}}>{completedRounds}</span>
            </div>
          </main>
        ) : (
          <main style={styles.settingsSection}>
            <div>
              <h4 style={styles.settingsTitle}>⏱️ Timer Settings</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={styles.settingItem}>
                  <label htmlFor="workMin" style={styles.settingLabel}>🎯 Work Duration (minutes)</label>
                  <input 
                    id="workMin" 
                    type="number" 
                    min={1} 
                    value={workMin} 
                    onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value)))} 
                    style={styles.settingInput}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.3)'}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="longMin" style={styles.settingLabel}>🌟 Long Break (minutes)</label>
                  <input 
                    id="longMin" 
                    type="number" 
                    min={1} 
                    value={longMin} 
                    onChange={(e) => setLongMin(Math.max(1, Number(e.target.value)))} 
                    style={styles.settingInput}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.3)'}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="roundsBeforeLong" style={styles.settingLabel}>🔄 Rounds before Long Break</label>
                  <input 
                    id="roundsBeforeLong" 
                    type="number" 
                    min={1} 
                    value={roundsBeforeLong} 
                    onChange={(e) => setRoundsBeforeLong(Math.max(1, Number(e.target.value)))} 
                    style={styles.settingInput}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.3)'}
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
                  <label htmlFor="autoStartNext" style={{...styles.settingLabel, cursor: 'pointer'}}>
                    🚀 Auto start next round
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 style={styles.settingsTitle}>⚡ Quick Presets</h4>
              <div style={styles.presetsContainer}>
                <button 
                  onClick={() => { setWorkMin(25); setShortMin(5); setLongMin(15); }} 
                  style={styles.presetsButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(32, 197, 195, 0.1)';
                    e.currentTarget.style.color = '#20C5C3';
                    e.currentTarget.style.borderColor = 'rgba(32, 197, 195, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Classic (25/5/15)
                </button>
                <button 
                  onClick={() => { setWorkMin(50); setShortMin(10); setLongMin(20); }} 
                  style={styles.presetsButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(32, 197, 195, 0.1)';
                    e.currentTarget.style.color = '#20C5C3';
                    e.currentTarget.style.borderColor = 'rgba(32, 197, 195, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Extended (50/10/20)
                </button>
                <button 
                  onClick={() => { setWorkMin(60); setShortMin(5); setLongMin(15); }} 
                  style={styles.presetsButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(32, 197, 195, 0.1)';
                    e.currentTarget.style.color = '#20C5C3';
                    e.currentTarget.style.borderColor = 'rgba(32, 197, 195, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Long Focus (60/5/15)
                </button>
              </div>
            </div>

            <div style={styles.quickActions}>
              <h4 style={styles.settingsTitle}>🗑️ Quick Actions</h4>
              <button 
                onClick={() => { 
                  // Reset to defaults
                  settingsData.current = { workMin: 60, shortMin: 5, longMin: 15, roundsBeforeLong: 4, autoStartNext: false };
                  setWorkMin(60);
                  setShortMin(5);
                  setLongMin(15);
                  setRoundsBeforeLong(4);
                  setAutoStartNext(false);
                  alert('Settings cleared successfully! 🎉'); 
                }} 
                style={styles.quickButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Clear All Settings
              </button>
            </div>
          </main>
        )}

        <footer style={styles.footer}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <span>Crafted with</span>
            <span style={{color: '#ef4444', fontSize: '1.25rem'}}>♥</span>
            <span>for productivity</span>
          </div>
          <div style={{marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7}}>
            Press <kbd style={{padding: '0.25rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontSize: '0.75rem'}}>Space</kbd> to start/pause • 
            <kbd style={{padding: '0.25rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontSize: '0.75rem', marginLeft: '0.25rem'}}>R</kbd> to reset
          </div>
        </footer>
      </div>
    </div>
  );
}
                  />
                </div>
                <div style={styles.settingItem}>
                  <label htmlFor="shortMin" style={styles.settingLabel}>☕ Short Break (minutes)</label>
                  <input 
                    id="shortMin" 
                    type="number" 
                    min={1} 
                    value={shortMin} 
                    onChange={(e) => setShortMin(Math.max(1, Number(e.target.value)))} 
                    style={styles.settingInput}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(32, 197, 195, 0.3)'}
