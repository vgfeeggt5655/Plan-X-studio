import React from "react";

interface StudyPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyPrayerDialog: React.FC<StudyPrayerDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-color rounded-2xl shadow-2xl p-8 w-full max-w-lg transform animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center text-primary mb-6">
          دعاء المذاكرة 📖
        </h2>
        <p className="text-lg text-text-secondary text-center leading-relaxed mb-8">
          اللهم إني أسألك فهم النبيين وحفظ المرسلين وإلهام الملائكة المقربين،
          اللهم اجعل لساني عامرًا بذكرك وقلبي بخشيتك وسري بطاعتك،
          فإنك على كل شيء قدير، وحسبنا الله ونعم الوكيل.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium shadow-md hover:shadow-lg hover:bg-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            إغلاق
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default StudyPrayerDialog;
