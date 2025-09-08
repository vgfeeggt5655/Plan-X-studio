import React, { useState, useEffect, useRef } from 'react';

// أيقونة X بسيطة
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // لإعادة تحميل الـ iframe
  const inputRef = useRef<HTMLInputElement>(null);

  // قاموس المصطلحات الطبية والترجمة
  const medicalTerms: { [key: string]: string } = {
    'قلب': 'heart',
    'رئة': 'lung',
    'كبد': 'liver',
    'كلى': 'kidney',
    'دماغ': 'brain',
    'عين': 'eye',
    'أذن': 'ear',
    'جهاز هضمي': 'digestive+system',
    'عظام': 'bones',
    'عضلات': 'muscles',
    'جلد': 'skin',
    'دم': 'blood',
    'سرطان': 'cancer',
    'التهاب': 'inflammation',
    'أشعة': 'xray',
    'تشريح': 'anatomy',
    'مرض': 'disease',
    'جراحة': 'surgery',
    'أعصاب': 'nerves',
    'هرمونات': 'hormones'
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const translateToEnglish = (arabicQuery: string): string => {
    return medicalTerms[arabicQuery] || arabicQuery;
  };

  const handleSearch = () => {
    if (!query.trim()) return;

    setLoading(true);
    
    // ترجمة المصطلح العربي إلى إنجليزي
    const englishTerm = translateToEnglish(query);
    setSearchTerm(englishTerm);
    
    // إعادة تحميل الـ iframe
    setIframeKey(prev => prev + 1);
    
    // محاكاة وقت التحميل
    setTimeout(() => setLoading(false), 1000);
  };

  // إنشاء رابط بحث Yandex للصور
  const getYandexImagesUrl = () => {
    if (!searchTerm) return '';
    return `https://yandex.com/images/search?text=${encodeURIComponent(searchTerm + ' medical')}`;
  };

  // اقتراحات البحث الطبي
  const medicalSuggestions = [
    'قلب', 'رئة', 'كبد', 'دماغ', 'عظام', 'عضلات', 'جلد', 'عين', 'أذن', 'كلى'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 h-4/5 flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">بحث الصور الطبية من Yandex</h2>
            <button
              onClick={onClose}
              className="p-1 text-white hover:text-blue-200"
            >
              <XIcon className="h-5 w-5"/>
            </button>
          </div>
          
          {/* شريط البحث */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSearch(); }}
              placeholder="ابحث عن مصطلحات طبية..."
              className="flex-1 p-2 rounded border border-blue-300"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-white text-blue-600 font-bold rounded hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>
          </div>

          {/* اقتراحات سريعة */}
          <div className="flex flex-wrap gap-1 mt-2">
            {medicalSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="px-2 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/40"
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ تحميل نتائج البحث...</div>
              </div>
            </div>
          ) : searchTerm ? (
            <div className="w-full h-full">
              <iframe
                key={iframeKey}
                src={getYandexImagesUrl()}
                className="w-full h-full border-none"
                title="نتائج البحث عن الصور الطبية من Yandex"
                sandbox="allow-scripts allow-same-origin allow-popups"
                onLoad={() => setLoading(false)}
                onError={(e) => {
                  const target = e.target as HTMLIFrameElement;
                  target.style.display = 'none';
                  // عرض رسالة بديلة
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <div class="flex flex-col items-center justify-center h-full p-4 text-center">
                        <div class="text-2xl mb-4">⚠️</div>
                        <div class="text-gray-700 font-medium mb-2">تعذر تحميل Yandex</div>
                        <div class="text-gray-500 text-sm mb-4">
                            قد تكون هناك قيود على عرض محتوى Yandex مباشرة في التطبيق.
                        </div>
                        <button onclick="window.open('${getYandexImagesUrl()}', '_blank')" 
                                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            فتح Yandex في نافذة جديدة
                        </button>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                اكتب مصطلحًا طبيًا واضغط بحث لرؤية الصور من Yandex
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
