import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoutIcon, TachometerIcon, UserCircleIcon, ChevronDownIcon, MenuIcon, XIcon } from './Icons';
import TodoDialog from './TodoDialog';
import SearchDialog from './SearchDialog';
import TimetableDialog from './TimetableDialog'; // ✨ استدعاء ديالوج الجدول الجديد

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isTodoOpen, setTodoOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isTimetableOpen, setTimetableOpen] = useState(false); // ✨ حالة الديالوج الجديد
  const [timetable, setTimetable] = useState({});
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [remainingTasks, setRemainingTasks] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    loadProgressFromLocal();
  }, []);

  // Update progress in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('todoProgress', JSON.stringify({ total: totalTasks, remaining: remainingTasks }));
  }, [totalTasks, remainingTasks]);

  // ✨ تحميل الجدول من JSON
  useEffect(() => {
    fetch("/data/timetable.json")
      .then((res) => res.json())
      .then((data) => setTimetable(data));
  }, []);

  const activeLinkClass = "text-primary font-semibold bg-primary/10";
  const inactiveLinkClass = "text-text-secondary hover:text-primary hover:bg-surface";
  const linkBaseClass = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";

  const navLinks = (
    <>
      <NavLink
        to="/"
        end
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
      >
        All Content
      </NavLink>

      {/* Tasks tab */}
      <div className="relative flex items-center group">
        <button
          onClick={() => setTodoOpen(true)}
          className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}
        >
          Tasks
        </button>

        {totalTasks > 0 && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gray-200 rounded overflow-hidden mt-1">
            <div className="h-3 bg-gradient-to-r from-green-400 to-blue-500 transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {totalTasks > 0 && (
          <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-text-secondary">
            {remainingTasks}/{totalTasks} left
          </span>
        )}
      </div>

      {/* زر البحث */}
      <button
        onClick={() => setSearchOpen(true)}
        className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}
      >
        Images
      </button>

      {/* ✨ زر جدول الترم */}
      <button
        onClick={() => setTimetableOpen(true)}
        className={`${linkBaseClass} text-text-secondary hover:text-primary hover:bg-surface`}
      >
        table
      </button>

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <NavLink
          to="/admin"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        >
          <TachometerIcon className="h-5 w-5" />
          Dashboard
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks}
          </div>

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
                    <UserCircleIcon className="h-8 w-8"/>
                  )}
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-color rounded-md shadow-lg py-1 z-10 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-primary/20 hover:text-primary transition-colors">
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-red-500/20 hover:text-red-500 transition-colors">
                      <LogoutIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-primary/20">
                {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-surface border-t border-border-color animate-fade-in-up" style={{animationDuration: '0.2s'}}>
            <div className="container mx-auto px-4 py-2 flex flex-col gap-1">
              {navLinks}
            </div>
          </div>
        )}
      </header>

      {/* Todo Dialog */}
      {user && <TodoDialog isOpen={isTodoOpen} onClose={() => setTodoOpen(false)} updateProgress={loadProgressFromLocal} />}

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onClose={() => setSearchOpen(false)} />

      {/* ✨ Timetable Dialog */}
      <TimetableDialog open={isTimetableOpen} onClose={() => setTimetableOpen(false)} timetable={timetable} />
    </>
  );
};

export default Header;
