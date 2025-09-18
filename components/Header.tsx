// ... (imports)
import { LogoutIcon, TachometerIcon, UserCircleIcon, ChevronDownIcon, MenuIcon, XIcon, PlayIcon, PauseIcon, StopIcon } from './Icons'; // ممكن تحتاج أيقونات جديدة
import PomodoroDialog from './PomodoroDialog';

const STORAGE_KEY = "planx_pomodoro_v1";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dialogs
  const [isPomodoroOpen, setPomodoroOpen] = useState(false);

  // Pomodoro Settings (Moved from dialog)
  const [workMin, setWorkMin] = useState<number>(60);
  const [shortMin, setShortMin] = useState<number>(5);
  const [longMin, setLongMin] = useState<number>(15);
  const [roundsBeforeLong, setRoundsBeforeLong] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);

  // Pomodoro Runtime States (Moved from dialog)
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState<number>(workMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings from localStorage
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

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workMin, shortMin, longMin, roundsBeforeLong, autoStartNext })
    );
  }, [workMin, shortMin, longMin, roundsBeforeLong, autoStartNext]);

  // Update timeLeft when settings or mode changes
  useEffect(() => {
    if (!running) { // Only reset if not running
      if (mode === "work") setTimeLeft(workMin * 60);
      if (mode === "shortBreak") setTimeLeft(shortMin * 60);
      if (mode === "longBreak") setTimeLeft(longMin * 60);
    }
  }, [mode, workMin, shortMin, longMin, running]);

  // Timer loop
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

  // When timeLeft hits zero
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
      setMode(nextIsLong ? "longBreak" : "shortBreak");
      setRunning(autoStartNext);
    } else {
      setMode("work");
      setRunning(autoStartNext);
    }
  }, [timeLeft, completedRounds, roundsBeforeLong, autoStartNext, mode]);

  // Functions to pass as props
  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    if (mode === "work") setTimeLeft(workMin * 60);
    if (mode === "shortBreak") setTimeLeft(shortMin * 60);
    if (mode === "longBreak") setTimeLeft(longMin * 60);
  };
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!isPomodoroOpen) return;
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
  }, [isPomodoroOpen, running, mode, workMin, shortMin, longMin]);

  // ... (rest of the header component)

  return (
    <>
      <header className="...">
        {/* ... (Existing nav) */}
        
        {/* Pomodoro Timer in Header */}
        <div className="flex items-center gap-2">
            <button onClick={() => setPomodoroOpen(true)} className="flex items-center gap-1 p-2 rounded-md hover:bg-surface transition-colors text-text-secondary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm-1-16v6h6v-6h-6z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                {running && (
                    <span className="text-sm font-mono text-primary">
                        {formatTime(timeLeft)}
                    </span>
                )}
            </button>
            {running ? (
                <button onClick={pause} className="p-1 rounded-full text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                    <PauseIcon className="h-4 w-4" />
                </button>
            ) : (
                <button onClick={start} className="p-1 rounded-full text-white bg-green-500 hover:bg-green-600 transition-colors">
                    <PlayIcon className="h-4 w-4" />
                </button>
            )}
            <button onClick={reset} className="p-1 rounded-full text-white bg-gray-500 hover:bg-gray-600 transition-colors">
                <StopIcon className="h-4 w-4" />
            </button>
        </div>

        {/* ... (Existing nav links and user dropdown) */}
      </header>

      {/* Dialogs */}
      {/* ... (other dialogs) */}
      <PomodoroDialog
        open={isPomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        mode={mode}
        setMode={setMode}
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        running={running}
        setRunning={setRunning}
        completedRounds={completedRounds}
        setCompletedRounds={setCompletedRounds}
        workMin={workMin}
        setWorkMin={setWorkMin}
        shortMin={shortMin}
        setShortMin={setShortMin}
        longMin={longMin}
        setLongMin={setLongMin}
        roundsBeforeLong={roundsBeforeLong}
        setRoundsBeforeLong={setRoundsBeforeLong}
        autoStartNext={autoStartNext}
        setAutoStartNext={setAutoStartNext}
      />
    </>
  );
};

export default Header;
