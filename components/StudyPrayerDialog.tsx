import React, { useState, useEffect } from "react";

const StudyPrayerDialog: React.FC = () => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // يظهر مرة واحدة في الجلسة
    if (sessionStorage.getItem("studyPrayerShown")) {
      setOpen(false);
    } else {
      setOpen(true);
      sessionStorage.setItem("studyPrayerShown", "true");
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md text-center shadow-lg">
        <h2 className="text-xl font-bold mb-4">📖 دعاء المذاكرة</h2>
        <p className="mb-3">
          "اللهم إني أسألك فهم النبيين، وحفظ المرسلين، وإلهام الملائكة
          المقربين، اللهم اجعل لساني عامرًا بذكرك، وقلبي بخشيتك، وسري
          بطاعتك، إنك على كل شيء قدير، وحسبي الله ونعم الوكيل."
        </p>
        <button
          onClick={() => setOpen(false)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ابدأ المذاكرة
        </button>
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
