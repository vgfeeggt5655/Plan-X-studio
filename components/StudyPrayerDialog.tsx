import React from "react";

interface StudyPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyPrayerDialog: React.FC<StudyPrayerDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fade-in-up border border-cyan-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-300 hover:text-white transition"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">
          دعاء بداية المذاكرة 📖
        </h2>
        <p className="text-lg leading-relaxed text-center text-gray-200">
          "اللهم إني أسألك فهم النبيين، وحفظ المرسلين، وإلهام الملائكة المقربين،
          اللهم اجعل ألسنتنا عامرة بذكرك، وقلوبنا بخشيتك، وأسرارنا بطاعتك،
          إنك على كل شيء قدير."
        </p>
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg transition"
          >
            ابدأ المذاكرة 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
