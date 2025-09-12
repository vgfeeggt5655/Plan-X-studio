import React, { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const StudyPrayerDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onMouseDown={(e) => {
        // close when clicking on backdrop only
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Study prayer dialog"
    >
      <div
        ref={panelRef}
        className="max-w-xl w-full mx-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-2xl border border-cyan-500/20"
      >
        <div className="flex justify-between items-start">
          <h3 className="text-2xl md:text-3xl font-bold text-cyan-300">
            دعاء بداية المذاكرة
          </h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white ml-2 text-xl"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 text-gray-200 leading-relaxed text-center">
          <p className="text-lg md:text-xl">
            اللهم إني أسألك فهم النبيين، وحفظ المرسلين، وإلهام الملائكة
            المقربين. اللهم افتح علينا فهم العلم، وثبّتنا على العمل.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg transition transform hover:scale-105"
          >
            ابدأ المذاكرة
          </button>
        </div>

        {/* subtle decorative line */}
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
