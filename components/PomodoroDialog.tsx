import React from 'react';

interface PomodoroDialogProps {
  open: boolean;
  onClose: () => void;
  pomodoroMode: 'work' | 'shortBreak' | 'longBreak';
  pomodoroTimeLeft: number;
  pomodoroRunning: boolean;
  setPomodoroRunning: (running: boolean) => void;
}

const PomodoroDialog: React.FC<PomodoroDialogProps> = ({
  open,
  onClose,
  pomodoroMode,
  pomodoroTimeLeft,
  pomodoroRunning,
  setPomodoroRunning,
}) => {
  if (!open) return null;

  const minutes = Math.floor(pomodoroTimeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (pomodoroTimeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-80 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
          {pomodoroMode === 'work'
            ? 'وقت العمل'
            : pomodoroMode === 'shortBreak'
            ? 'استراحة قصيرة'
            : 'استراحة طويلة'}
        </h2>

        <div className="text-4xl font-mono text-center mb-6">
          {minutes}:{seconds}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setPomodoroRunning(!pomodoroRunning)}
            className={`px-4 py-2 rounded-md text-white font-semibold ${
              pomodoroRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {pomodoroRunning ? 'إيقاف' : 'تشغيل'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroDialog;
