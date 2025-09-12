import React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const StudyPrayerDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          دعاء المذاكرة 📖
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
          "اللهم إني أسألك فهم النبيين، وحفظ المرسلين، وإلهام الملائكة
          المقربين، اللهم اجعل ألسنتنا عامرة بذكرك وقلوبنا بخشيتك وسرائرنا
          بطاعتك، إنك على كل شيء قدير، وحسبنا الله ونعم الوكيل"
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-cyan-400 transition"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
