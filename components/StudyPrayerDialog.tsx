import React from "react";

interface StudyPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyPrayerDialog: React.FC<StudyPrayerDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl font-extrabold text-primary mb-4">
          📖 دعاء المذاكرة
        </h2>
        <p className="text-lg text-text-secondary leading-relaxed mb-6">
          اللهم إني أسألك فهم النبيين، وحفظ المرسلين، والملائكة المقربين.
          اللهم اجعل ألسنتنا عامرة بذكرك، وقلوبنا بخشيتك، وأسرارنا بطاعتك.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-md hover:bg-cyan-500 transition-colors"
        >
          ابدأ المذاكرة
        </button>
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
