import React, { useState, useEffect, useRef } from 'react';

const WORK_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK_TIME = 5 * 60; // 5 minutes
const LONG_BREAK_TIME = 15 * 60; // 15 minutes
const POMODORO_GOAL = 4; // Long break after 4 pomodoros

const PomodoroDialog = ({ isOpen, onClose }) => {
  const [time, setTime] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  
  const audioContextRef = useRef(null);
  const timerId = useRef(null);

  // Initialize and play a simple sound using Web Audio API
  const playSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 1);
    } catch (e) {
      console.error('Web Audio API not supported or failed to initialize:', e);
    }
  };

  useEffect(() => {
    if (isActive && time > 0) {
      timerId.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      // Stop the timer and play sound, but do not switch automatically
      clearInterval(timerId.current);
      setIsActive(false);
      playSound();
    }

    return () => clearInterval(timerId.current);
  }, [isActive, time]);

  const toggleTimer = () => {
    if (time === 0) {
      if (!isBreak) { // Work session ended, prepare for break
        setPomodorosCompleted((prev) => prev + 1);
        if (pomodorosCompleted + 1 >= POMODORO_GOAL) {
          setIsBreak(true);
          setTime(LONG_BREAK_TIME);
        } else {
          setIsBreak(true);
          setTime(SHORT_BREAK_TIME);
        }
      } else { // Break session ended, prepare for work
        setIsBreak(false);
        setTime(WORK_TIME);
      }
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    clearInterval(timerId.current);
    setIsActive(false);
    setIsBreak(false);
    setTime(WORK_TIME);
    setPomodorosCompleted(0);
  };

  const skipSession = () => {
    clearInterval(timerId.current);
    setIsActive(false);
    if (!isBreak) { // Skip work session
      setPomodorosCompleted((prev) => prev + 1);
      if (pomodorosCompleted + 1 >= POMODORO_GOAL) {
        setIsBreak(true);
        setTime(LONG_BREAK_TIME);
        setPomodorosCompleted(0);
      } else {
        setIsBreak(true);
        setTime(SHORT_BREAK_TIME);
      }
    } else { // Skip break session
      setIsBreak(false);
      setTime(WORK_TIME);
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const totalTime = isBreak
    ? (pomodorosCompleted >= POMODORO_GOAL - 1 ? LONG_BREAK_TIME : SHORT_BREAK_TIME)
    : WORK_TIME;

  const progress = (time / totalTime) * 100;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (progress / 100) * circumference;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 font-['Inter']">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-11/12 md:w-3/5 lg:w-2/5 flex flex-col items-center relative transition-transform duration-300 transform scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          مؤقت بومودورو
        </h2>

        <div className="text-center mb-6">
          <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
            {isBreak ? (pomodorosCompleted >= POMODORO_GOAL - 1 ? 'راحة طويلة' : 'راحة قصيرة') : 'جلسة عمل'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isBreak ? `الاستراحة رقم ${pomodorosCompleted}` : `بومودورو #${pomodorosCompleted + 1}`}
          </p>
        </div>

        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-gray-300 dark:text-gray-700"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="100"
              cy="100"
            />
            <circle
              className={`${
                isBreak
                  ? 'text-green-500'
                  : 'text-red-500'
              } transition-colors duration-500`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="100"
              cy="100"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            {time > 0 ? (
              <h1 className="text-6xl font-bold text-gray-800 dark:text-white">
                {displayTime}
              </h1>
            ) : (
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                انتهت الجلسة!
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center space-x-4 w-full">
          <button
            onClick={toggleTimer}
            className={`
              w-1/2 py-3 px-6 rounded-full font-bold text-white transition-all duration-300 shadow-md
              ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            `}
          >
            {isActive ? 'إيقاف مؤقت' : 'بدء'}
          </button>
          <button
            onClick={resetTimer}
            className="w-1/2 py-3 px-6 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 shadow-md"
          >
            إعادة ضبط
          </button>
        </div>

        <div className="mt-4 w-full">
          <button
            onClick={skipSession}
            className="w-full py-2 px-4 rounded-full text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300"
          >
            تخطي الجلسة
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroDialog;
