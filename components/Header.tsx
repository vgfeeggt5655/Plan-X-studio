import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoutIcon, TachometerIcon, UserCircleIcon, ChevronDownIcon, MenuIcon, XIcon } from './Icons';
import TodoDialog from './TodoDialog';
import SearchDialog from './SearchDialog';
import TimetableDialog from './TimetableDialog';
import PomodoroDialog from './PomodoroDialog';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown & Menu
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Dialogs
  const [isTodoOpen, setTodoOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isTimetableOpen, setTimetableOpen] = useState(false);
  const [isPomodoroOpen, setPomodoroOpen] = useState(false);

  // Data / Progress
  const [timetable, setTimetable] = useState({});
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [remainingTasks, setRemainingTasks] = useState(0);

  // Pomodoro Timer State
  type Mode = 'work' | 'shortBreak' | 'longBreak';
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<Mode>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [workMin, setWorkMin] = useState<number>(25);
  const [shortMin, setShortMin] = useState<number>(5);
  const [longMin, setLongMin] = useState<number>(15);
  const [roundsBeforeLong, setRoundsBeforeLong] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const STORAGE_KEY = 'planx_pomodoro_v1';

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

  // Update timeLeft when mode or settings change
  useEffect(() => {
    if (pomodoroMode === 'work') setPomodoroTimeLeft(workMin * 60);
    if (pomodoroMode === 'shortBreak') setPomodoroTimeLeft(shortMin * 60);
    if (pomodoroMode === 'longBreak') setPomodoroTimeLeft(longMin * 60);
  }, [pomodoroMode, workMin, shortMin, longMin]);

  // Timer loop
  useEffect(() => {
    if (!pomodoroRunning) return;
    tickRef.current = window.setInterval(() => {
      setPomodoroTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tickRef.current || undefined);
          tickRef.current = null;
          if (!audioRef.current) {
            audioRef.current = new Audio('/data/رنين-المنبه-لشاومي.mp3');
          }
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});

          let nextMode: Mode = pomodoroMode;
          let nextCount = pomodoroCount;

          if (pomodoroMode === 'work') {
            nextCount++;
            setPomodoroCount(nextCount);
            nextMode = nextCount % roundsBeforeLong === 0 ? 'longBreak' : 'shortBreak';
          } else {
            nextMode = 'work';
          }
          setPomodoroMode(nextMode);
          setPomodoroRunning(autoStartNext);
          return nextMode === 'work' ? workMin * 60 : nextMode === 'shortBreak' ? shortMin * 60 : longMin * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [pomodoroRunning, pomodoroMode, pomodoroCount, workMin, shortMin, longMin, autoStartNext]);

  // Reset timer when dialog opens
  useEffect(() => {
    if (!isPomodoroOpen) return;
    if (pomodoroMode === 'work') setPomodoroTimeLeft(workMin * 60);
    if (pomodoroMode === 'shortBreak') setPomodoroTimeLeft(shortMin * 60);
    if (pomodoroMode === 'longBreak') setPomodoroTimeLeft(longMin * 60);
  }, [isPomodoroOpen, pomodoroMode, workMin, shortMin, longMin]);

  const startPomodoro = () => {
    if (pomodoroTimeLeft <= 0) {
      if (pomodoroMode === 'work') setPomodoroTimeLeft(workMin * 60);
      if (pomodoroMode === 'shortBreak') setPomodoroTimeLeft(shortMin * 60);
      if (pomodoroMode === 'longBreak') setPomodoroTimeLeft(longMin * 60);
    }
    setPomodoroRunning(true);
  };

  const pausePomodoro = () => setPomodoroRunning(false);

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    if (pomodoroMode === 'work') setPomodoroTimeLeft(workMin * 60);
    if (pomodoroMode === 'shortBreak') setPomodoroTimeLeft(shortMin * 60);
    if (pomodoroMode === 'longBreak') setPomodoroTimeLeft(longMin * 60);
  };

  const skipPomodoro = () => setPomodoroTimeLeft(0);

  // Format time for display
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Load progress from localStorage
  const loadProgressFromLocal = () => {
    const saved = localStorage.getItem('todoProgress');
    if (saved) {
      const { total, remaining } = JSON.parse(saved);
      setTotalTasks(total);
      setRemainingTasks(remaining);
      setProgress(total ? Math.round(((total - remaining) / total) * 100) : 0);
    }
  };

  useEffect(() => loadProgressFromLocal(), []);
  useEffect(() => localStorage.setItem('todoProgress', JSON.stringify({ total: totalTasks, remaining: remainingTasks })), [totalTasks, remainingTasks]);

  // Load timetable
  useEffect(() => {
    fetch('/data/timetable.json')
      .then((res) => res.json())
      .then((data) => setTimetable(data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown/menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLinkClass = 'text-primary font-semibold bg-primary/10';
  const inactiveLinkClass = 'text-text-secondary hover:text-primary hover:bg-surface';
  const linkBaseClass = 'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors';

  const navLinks = (
    <>
      <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
        All Content
      </NavLink>

      <div className="relative flex items-center group">
        <button onClick={() => setTodoOpen(true)} className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}>
          Tasks
        </button>
        {totalTasks > 0 && (
          <>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gray-200 rounded overflow-hidden mt-1">
              <div className="h-3 bg-gradient-to-r from-green-400 to-blue-500 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-text-secondary">{remainingTasks}/{totalTasks} left</span>
          </>
        )}
      </div>

      <button onClick={() => setSearchOpen(true)} className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}>
        Images
      </button>

      <button onClick={() => setTimetableOpen(true)} className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}>
        Table
      </button>

      <button onClick={() => setPomodoroOpen(true)} className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}>
        Pomodoro
        <span className="ml-2 text-sm font-mono">{formatTime(pomodoroTimeLeft)}</span>
      </button>

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>
          <TachometerIcon className="h-5 w-5" /> Dashboard
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border-color">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <NavLink to="/" className="text-xl font-bold text-text-primary flex items-center gap-2">
            <img src="./images/logo.png" alt="Logo" className="h-9 w-9" />
            <span>Plan X</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-2">{navLinks}</div>

          <div className="flex items-center gap-2">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-primary/20"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="User Avatar" className="h-8 w-8 rounded-full object-cover border-2 border-primary/50" />
                  ) : (
                    <UserCircleIcon className="h-8 w-8" />
                  )}
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-color rounded-md shadow-lg py-1 z-10 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-primary/20 hover:text-primary transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-red-500/20 hover:text-red-500 transition-colors"
                    >
                      <LogoutIcon className="h-5 w-5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-primary/20">
                {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="md:hidden bg-surface border-t border-border-color animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            <div className="container mx-auto px-4 py-2 flex flex-col gap-1">{navLinks}</div>
          </div>
        )}
      </header>

      <TodoDialog isOpen={isTodoOpen} onClose={() => setTodoOpen(false)} updateProgress={loadProgressFromLocal} />
      <SearchDialog open={isSearchOpen} onClose={() => setSearchOpen(false)} />
      <TimetableDialog open={isTimetableOpen} onClose={() => setTimetableOpen(false)} timetable={timetable} />
      <PomodoroDialog
        open={isPomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        timeLeft={pomodoroTimeLeft}
        running={pomodoroRunning}
        mode={pomodoroMode}
        completedRounds={pomodoroCount}
        workMin={workMin}
        shortMin={shortMin}
        longMin={longMin}
        roundsBeforeLong={roundsBeforeLong}
        autoStartNext={autoStartNext}
        setWorkMin={setWorkMin}
        setShortMin={setShortMin}
        setLongMin={setLongMin}
        setRoundsBeforeLong={setRoundsBeforeLong}
        setAutoStartNext={setAutoStartNext}
        start={startPomodoro}
        pause={pausePomodoro}
        reset={resetPomodoro}
        skip={skipPomodoro}
        setMode={setPomodoroMode}
        setTimeLeft={setPomodoroTimeLeft}
      />
    </>
  );
};

export default Header;
