import React, { useState, useEffect } from 'react';

interface StudyPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyPrayerDialog: React.FC<StudyPrayerDialogProps> = ({ isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Dialog Container */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] transform transition-all duration-300 ease-out ${
        isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
      }`}>
        
        {/* Main Dialog */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          
          {/* Header with Islamic pattern */}
          <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z" fill="rgba(255,255,255,0.05)"%3E%3C/path%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">🤲 دعاء المذاكرة</h2>
                <p className="text-emerald-100 text-sm">بسم الله نبدأ رحلة العلم والمعرفة</p>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-emerald-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            
            {/* Prayer Text */}
            <div className="text-center space-y-6">
              
              {/* Arabic Prayer */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
                <p className="text-2xl leading-relaxed text-emerald-300 font-arabic" style={{fontFamily: 'Arabic UI Display, Arial'}}>
                  اللَّهُمَّ إِنِّي أَسْأَلُكَ فَهْمَ النَّبِيِّينَ
                  <br />
                  وَحِفْظَ الْمُرْسَلِينَ وَالْمُقَرَّبِينَ
                  <br />
                  اللَّهُمَّ اجْعَلْ أَلْسِنَتَنَا عَامِرَةً بِذِكْرِكَ
                  <br />
                  وَقُلُوبَنَا بِخَشْيَتِكَ وَأَسْرَارَنَا بِطَاعَتِكَ
                  <br />
                  إِنَّكَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ
                  <br />
                  وَحَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ
                </p>
              </div>

              {/* Translation */}
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-5 border border-blue-700/20">
                <p className="text-blue-200 text-lg leading-relaxed">
                  "اللهم إني أسألك فهم النبيين وحفظ المرسلين والمقربين، اللهم اجعل ألسنتنا عامرة بذكرك وقلوبنا بخشيتك وأسرارنا بطاعتك، إنك على كل شيء قدير وحسبنا الله ونعم الوكيل"
                </p>
              </div>

              {/* Additional Duas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-700/20">
                  <div className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                    📖 <span>قبل المذاكرة</span>
                  </div>
                  <p className="text-purple-200 text-sm leading-relaxed">
                    "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي"
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-4 border border-orange-700/20">
                  <div className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                    🎯 <span>بعد المذاكرة</span>
                  </div>
                  <p className="text-orange-200 text-sm leading-relaxed">
                    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي"
                  </p>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="bg-gradient-to-r from-cyan-900/30 to-teal-900/30 rounded-xl p-5 border border-cyan-700/20">
                <div className="text-cyan-300 font-semibold mb-3 flex items-center justify-center gap-2">
                  ✨ <span>تذكر دائماً</span> ✨
                </div>
                <p className="text-cyan-200 text-base leading-relaxed italic">
                  "وَقُل رَّبِّ زِدْنِي عِلْمًا" - طه (114)
                  <br />
                  <span className="text-sm text-cyan-300 mt-2 block">
                    العلم نور والجهل ظلام، فاستنر بنور العلم واجعل الله معك في كل خطوة
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>ابدأ المذاكرة بإذن الله</span>
              </button>
              
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>⏭️</span>
                <span>تخطي</span>
              </button>
            </div>
            
            <p className="text-center text-slate-400 text-xs mt-4">
              سيظهر هذا الدعاء مرة واحدة فقط في كل جلسة تصفح
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPrayerDialog;
