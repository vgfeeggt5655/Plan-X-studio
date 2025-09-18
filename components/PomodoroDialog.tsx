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
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // runtime state
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState<number>(workMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [completedRounds, setCompletedRounds] = useState<number>(0);

  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // load settings
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

  // save settings
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workMin, shortMin, longMin, roundsBeforeLong, autoStartNext })
    );
  }, [workMin, shortMin, longMin, roundsBeforeLong, autoStartNext]);

  // update timeLeft only if mode changes manually
  useEffect(() => {
    setTimeLeft((prev) => {
      const total = mode === "work" ? workMin * 60 : mode === "shortBreak" ? shortMin * 60 : longMin * 60;
      return prev > total ? total : prev;
    });
  }, [mode, workMin, shortMin, longMin]);

  // timer loop
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
  }, [running]);

  // handle zero
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (!audioRef.current) audioRef.current = new Audio("/data/رنين-المنبه-لشاومي.mp3");
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

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
  }, [open, showSettings]);

  function start() {
    if (timeLeft <= 0) {
      const total = mode === "work" ? workMin * 60 : mode === "shortBreak" ? shortMin * 60 : longMin * 60;
      setTimeLeft(total);
    }
    setRunning(true);
  }

  function pause() { setRunning(false); }

  function reset() {
    setRunning(false);
    const total = mode === "work" ? workMin * 60 : mode === "shortBreak" ? shortMin * 60 : longMin * 60;
    setTimeLeft(total);
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
    <div style={{
      position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex:50,
      display:'flex', justifyContent:'center', alignItems:'center',
      backgroundColor:'rgba(0,0,0,0.7)', padding:'1rem'
    }}>
      <div style={{
        width:'100%', maxWidth:'30rem', borderRadius:'1.5rem',
        backgroundColor:'#0A192F', color:'#fff', padding:'2rem', border:'1px solid #1f2937'
      }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', borderBottom:'1px solid #1f2937', paddingBottom:'1rem' }}>
          <h3 style={{ fontSize:'1.5rem', fontWeight:800 }}>{showSettings ? "Settings" : "Pomodoro Timer"}</h3>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {!showSettings ? (
              <button onClick={() => setShowSettings(true)} style={{ background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>⚙️</button>
            ) : (
              <button onClick={() => setShowSettings(false)} style={{ background:'transparent', border:'none', fontWeight:'bold', cursor:'pointer' }}>← Back</button>
            )}
            <button onClick={onClose} style={{ background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>&times;</button>
          </div>
        </header>

        {!showSettings ? (
          <main style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2rem' }}>
            <div style={{ display:'flex', gap:'0.75rem', backgroundColor:'#15253F', padding:'0.5rem', borderRadius:'9999px' }}>
              {["work","shortBreak","longBreak"].map((m) => (
                <button key={m} onClick={() => { setMode(m as Mode); reset(); }}
                  style={{
                    padding:'0.75rem 2rem', borderRadius:'9999px', fontWeight:700,
                    backgroundColor: mode===m?'#20C5C3':'transparent',
                    color: mode===m?'#0A192F':'#9ca3af', border:'1px solid #374151', cursor:'pointer'
                  }}>
                  {m==="work"?"Work":m==="shortBreak"?"Short":"Long"}
                </button>
              ))}
            </div>

            <div style={{ position:'relative', width:'16rem', height:'16rem', display:'flex', justifyContent:'center', alignItems:'center' }}>
              <svg viewBox="0 0 120 120" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                <circle cx="60" cy="60" r="54" strokeWidth="8" stroke="#1F2A40" fill="none"></circle>
                <circle cx="60" cy="60" r="54" strokeWidth="8" strokeLinecap="round" stroke="#20C5C3"
                  style={{ strokeDasharray: 339.292, strokeDashoffset: 339.292 - progress*339.292, transition:'stroke-dashoffset 1s linear' }}
                  transform="rotate(-90 60 60)" />
              </svg>
              <div style={{ position:'relative', textAlign:'center', color:'#fff' }}>
                <p style={{ fontSize:'4rem', fontWeight:300, lineHeight:1 }}>{format(timeLeft)}</p>
                <p style={{ fontSize:'0.875rem', color:'#9ca3af' }}>{mode==="work"?"Focus Time":"Break Time"}</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem' }}>
              {!running ? (
                <button onClick={start} style={{ padding:'0.75rem 2rem', borderRadius:'9999px', fontWeight:700, backgroundColor:'#059669', color:'#0A192F', border:'none', cursor:'pointer' }}>Start</button>
              ) : (
                <button onClick={pause} style={{ padding:'0.75rem 2rem', borderRadius:'9999px', fontWeight:700, backgroundColor:'#f59e0b', color:'#fff', border:'none', cursor:'pointer' }}>Pause</button>
              )}
              <button onClick={reset} style={{ padding:'0.75rem 2rem', borderRadius:'9999px', fontWeight:700, border:'1px solid #374151', color:'#d1d5db', background:'transparent', cursor:'pointer' }}>Reset</button>
              <button onClick={() => setTimeLeft(0)} style={{ padding:'0.75rem 2rem', borderRadius:'9999px', fontWeight:700, border:'1px solid #374151', color:'#d1d5db', background:'transparent', cursor:'pointer' }}>Skip</button>
            </div>

            <p style={{ fontSize:'0.875rem', color:'#9ca3af', marginTop:'1rem' }}>
              Completed Rounds: <span style={{ fontWeight:600, color:'#5eead4' }}>{completedRounds}</span>
            </p>
          </main>
        ) : (
          <main style={{ display:'flex', flexDirection:'column', gap:'1.5rem', padding:'1rem 0' }}>
            <div>
              <h4 style={{ fontSize:'1.25rem', fontWeight:700, color:'#e5e7eb' }}>Timer Settings</h4>
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <label style={{ fontSize:'0.875rem', color:'#d1d5db' }}>Work Duration</label>
                  <input type="number" min={1} value={workMin} onChange={e=>setWorkMin(Math.max(1, Number(e.target.value)))} style={{ width:'6rem', padding:'0.5rem', backgroundColor:'#15253F', color:'#20C5C3', border:'1px solid #374151', borderRadius:'0.5rem', textAlign:'right' }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <label style={{ fontSize:'0.875rem', color:'#d1d5db' }}>Short Break</label>
                  <input type="number" min={1} value={shortMin} onChange={e=>setShortMin(Math.max(1, Number(e.target.value)))} style={{ width:'6rem', padding:'0.5rem', backgroundColor:'#15253F', color:'#20C5C3', border:'1px solid #374151', borderRadius:'0.5rem', textAlign:'right' }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <label style={{ fontSize:'0.875rem', color:'#d1d5db' }}>Long Break</label>
                  <input type="number" min={1} value={longMin} onChange={e=>setLongMin(Math.max(1, Number(e.target.value)))} style={{ width:'6rem', padding:'0.5rem', backgroundColor:'#15253F', color:'#20C5C3', border:'1px solid #374151', borderRadius:'0.5rem', textAlign:'right' }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <label style={{ fontSize:'0.875rem', color:'#d1d5db' }}>Rounds Before Long Break</label>
                  <input type="number" min={1} value={roundsBeforeLong} onChange={e=>setRoundsBeforeLong(Math.max(1, Number(e.target.value)))} style={{ width:'6rem', padding:'0.5rem', backgroundColor:'#15253F', color:'#20C5C3', border:'1px solid #374151', borderRadius:'0.5rem', textAlign:'right' }} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <label style={{ fontSize:'0.875rem', color:'#d1d5db' }}>Auto Start Next</label>
                  <input type="checkbox" checked={autoStartNext} onChange={e=>setAutoStartNext(e.target.checked)} />
                </div>
              </div>
            </div>
          </main>
        )}

        <footer style={{ marginTop:'2rem', fontSize:'0.875rem', color:'#6b7280', textAlign:'center', borderTop:'1px solid #1f2937', paddingTop:'1.5rem' }}>
          Designed with <span style={{color:'#ef4444'}}>&hearts;</span> for productivity.
        </footer>
      </div>
    </div>
  );
}
