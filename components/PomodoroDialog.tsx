import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdPlayArrow,
    MdPause,
    MdRefresh,
    MdSettings,
    MdBarChart,
    MdClose,
} from 'react-icons/md';

// Interfaces for better type safety
interface TimerProps {
    open: boolean;
    onClose: () => void;
}

interface SessionStats {
    workTime: number;
    breakTime: number;
    sessions: number;
    totalTime: number;
}

interface TimerMode {
    title: string;
    color: string;
    secondaryColor: string;
    bgGradient: string;
    glowColor: string;
    description: string;
    ringColor: string;
    defaultTime: number;
}

const MODES: Record<'work' | 'shortBreak' | 'longBreak', TimerMode> = {
    work: {
        title: 'Work 🍅',
        color: 'text-indigo-500',
        secondaryColor: 'text-indigo-600',
        bgGradient: 'from-indigo-600/30 to-indigo-800/30',
        glowColor: 'shadow-[0_0_80px_10px] shadow-indigo-500/50',
        description: 'Time to focus!',
        ringColor: 'stroke-indigo-500',
        defaultTime: 25 * 60,
    },
    shortBreak: {
        title: 'Short Break ☕',
        color: 'text-emerald-500',
        secondaryColor: 'text-emerald-600',
        bgGradient: 'from-emerald-600/30 to-emerald-800/30',
        glowColor: 'shadow-[0_0_80px_10px] shadow-emerald-500/50',
        description: 'Time to rest!',
        ringColor: 'stroke-emerald-500',
        defaultTime: 5 * 60,
    },
    longBreak: {
        title: 'Long Break 🛋️',
        color: 'text-purple-500',
        secondaryColor: 'text-purple-600',
        bgGradient: 'from-purple-600/30 to-purple-800/30',
        glowColor: 'shadow-[0_0_80px_10px] shadow-purple-500/50',
        description: 'Long rest!',
        ringColor: 'stroke-purple-500',
        defaultTime: 15 * 60,
    },
};

const PomodoroTimer: React.FC<TimerProps> = ({ open, onClose }) => {
    const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.defaultTime);
    const [running, setRunning] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [stats, setStats] = useState<SessionStats>(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedStats = localStorage.getItem('pomodoroStats');
                return storedStats ? JSON.parse(storedStats) : { workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 };
            } catch (error) {
                console.error("Failed to parse stats from localStorage", error);
                return { workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 };
            }
        }
        return { workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 };
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Persist stats to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pomodoroStats', JSON.stringify(stats));
        }
    }, [stats]);

    // Handle timer logic
    useEffect(() => {
        if (running && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && running) {
            handleSessionEnd();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [running, timeLeft]);

    // Cleanup when component unmounts or dialog is closed
    useEffect(() => {
        if (!open) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRunning(false);
            resetState();
        }
    }, [open]);

    // Request Notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && "Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    const handleStart = useCallback(() => setRunning(true), []);
    const handlePause = useCallback(() => setRunning(false), []);
    const handleReset = useCallback(() => {
        setRunning(false);
        setTimeLeft(MODES[mode].defaultTime);
        setIsSessionEnded(false);
    }, [mode]);

    const handleModeChange = useCallback((newMode: 'work' | 'shortBreak' | 'longBreak') => {
        if (running) handlePause();
        setMode(newMode);
        setTimeLeft(MODES[newMode].defaultTime);
        setIsSessionEnded(false);
    }, [running, handlePause]);

    const handleSessionEnd = () => {
        setRunning(false);
        setIsSessionEnded(true);

        // Send a notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Session ended! ${MODES[mode].title}`, {
                body: MODES[mode].description,
                icon: 'https://cdn-icons-png.flaticon.com/512/365/365792.png'
            });
        }

        // Update stats and switch mode
        setStats(prevStats => {
            const timeAdded = MODES[mode].defaultTime;
            let newStats = { ...prevStats };
            if (mode === 'work') {
                newStats = { ...newStats, workTime: newStats.workTime + timeAdded, sessions: newStats.sessions + 1 };
                if ((newStats.sessions % 4) === 0) {
                    handleModeChange('longBreak');
                } else {
                    handleModeChange('shortBreak');
                }
            } else {
                newStats = { ...newStats, breakTime: newStats.breakTime + timeAdded };
                handleModeChange('work');
            }
            newStats.totalTime += timeAdded;
            return newStats;
        });
    };

    const resetState = () => {
        setRunning(false);
        setTimeLeft(MODES.work.defaultTime);
        setMode('work');
        setShowStats(false);
        setShowSettings(false);
    };

    const handleCloseWithReset = () => {
        onClose();
        resetState();
    };

    const handleCustomTime = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const minutes = Number((e.target as any).minutes.value);
        if (minutes >= 1 && minutes <= 180) {
            setTimeLeft(minutes * 60);
            setShowSettings(false);
        }
    };

    const resetStats = () => {
        setStats({ workTime: 0, breakTime: 0, sessions: 0, totalTime: 0 });
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / MODES[mode].defaultTime) * 100;
    const progressCircleOffset = 2 * Math.PI * 90 * (1 - progress / 100);

    const { color, secondaryColor, bgGradient, glowColor, ringColor } = MODES[mode];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all duration-300"
                    onClick={handleCloseWithReset}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-xl rounded-2xl bg-gray-800 p-8 shadow-2xl transition-all duration-300 ${bgGradient} ${glowColor} relative`}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleCloseWithReset}
                            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <MdClose size={24} />
                        </button>

                        {/* Title and Mode Tabs */}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-4">Pomodoro Timer</h2>
                            <div className="flex bg-gray-900/50 rounded-full p-1 border border-gray-700/50">
                                {Object.entries(MODES).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleModeChange(key as any)}
                                        className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${mode === key ? `${value.color} bg-gray-700/50` : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {value.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content (Timer/Stats/Settings) */}
                        <div className="relative flex flex-col items-center justify-center p-6">
                            {showStats ? (
                                <motion.div
                                    key="stats"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="w-full text-white text-center"
                                >
                                    <h3 className="text-2xl font-bold mb-4">Session Stats</h3>
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="p-4 bg-gray-700/50 rounded-lg">
                                            <p className="text-sm text-gray-300">Total Work Time</p>
                                            <p className="text-xl font-bold">{formatTime(stats.workTime)}</p>
                                        </div>
                                        <div className="p-4 bg-gray-700/50 rounded-lg">
                                            <p className="text-sm text-gray-300">Total Break Time</p>
                                            <p className="text-xl font-bold">{formatTime(stats.breakTime)}</p>
                                        </div>
                                        <div className="p-4 bg-gray-700/50 rounded-lg">
                                            <p className="text-sm text-gray-300">Total Sessions</p>
                                            <p className="text-xl font-bold">{stats.sessions}</p>
                                        </div>
                                        <div className="p-4 bg-gray-700/50 rounded-lg">
                                            <p className="text-sm text-gray-300">Avg. Session Time</p>
                                            <p className="text-xl font-bold">{stats.sessions > 0 ? formatTime(stats.totalTime / stats.sessions) : '00:00'}</p>
                                        </div>
                                    </div>
                                    <button onClick={resetStats} className="mt-6 px-4 py-2 rounded-full text-sm font-semibold bg-red-600 hover:bg-red-700 transition-colors">
                                        Reset Stats
                                    </button>
                                </motion.div>
                            ) : showSettings ? (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="w-full text-white text-center"
                                >
                                    <h3 className="text-2xl font-bold mb-4">Set Custom Time</h3>
                                    <form onSubmit={handleCustomTime} className="flex flex-col items-center space-y-4">
                                        <label className="text-gray-300">Minutes (1-180):</label>
                                        <input
                                            type="number"
                                            name="minutes"
                                            defaultValue={Math.floor(MODES[mode].defaultTime / 60)}
                                            min="1"
                                            max="180"
                                            className="w-24 text-center rounded-lg bg-gray-700/50 text-white p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button type="submit" className="px-6 py-2 rounded-full font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                            Set Time
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="timer"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    className="relative flex flex-col items-center justify-center"
                                >
                                    {/* Progress Circle SVG */}
                                    <svg className="w-64 h-64 transform -rotate-90">
                                        <circle
                                            cx="128"
                                            cy="128"
                                            r="90"
                                            className="stroke-gray-700/50 stroke-[10] fill-transparent"
                                        />
                                        <circle
                                            cx="128"
                                            cy="128"
                                            r="90"
                                            className={`stroke-[10] fill-transparent transition-all duration-500 ${ringColor}`}
                                            style={{
                                                strokeDasharray: 2 * Math.PI * 90,
                                                strokeDashoffset: progressCircleOffset,
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center inset-0">
                                        <span className={`text-6xl font-extrabold ${color} drop-shadow-lg`}>
                                            {formatTime(timeLeft)}
                                        </span>
                                        {isSessionEnded && (
                                            <span className={`mt-2 text-xl font-bold ${secondaryColor} animate-pulse`}>
                                                Session Ended 🎉
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Controls & Action Buttons */}
                        <div className="mt-8 flex justify-center space-x-4">
                            {!showStats && !showSettings && (
                                <>
                                    {running ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handlePause}
                                            className="flex items-center justify-center p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white shadow-lg"
                                        >
                                            <MdPause size={24} />
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleStart}
                                            className="flex items-center justify-center p-4 rounded-full bg-emerald-600 hover:bg-emerald-700 transition-colors text-white shadow-lg"
                                        >
                                            <MdPlayArrow size={24} />
                                        </motion.button>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleReset}
                                        className="flex items-center justify-center p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors text-white shadow-lg"
                                    >
                                        <MdRefresh size={24} />
                                    </motion.button>
                                </>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSettings(!showSettings)}
                                className={`flex items-center justify-center p-4 rounded-full transition-colors text-white shadow-lg ${showSettings ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                <MdSettings size={24} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowStats(!showStats)}
                                className={`flex items-center justify-center p-4 rounded-full transition-colors text-white shadow-lg ${showStats ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                <MdBarChart size={24} />
                            </motion.button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PomodoroTimer;
