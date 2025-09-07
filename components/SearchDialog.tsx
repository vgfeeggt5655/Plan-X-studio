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
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    'جهاز هضمي': 'digestive system',
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
      setImages([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const translateToEnglish = (arabicQuery: string): string => {
    return medicalTerms[arabicQuery] || arabicQuery;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setImages([]);
    setError('');

    try {
      // ترجمة المصطلح العربي إلى إنجليزي
      const englishTerm = translateToEnglish(query);
      
      // محاكاة جلب الصور (بدلاً من API حقيقي)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // إنشاء صور وهمية بناء على البحث
      const generatedImages = [
        `https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&1`,
        `https://source.unsplash.com/300x200/?health,${encodeURIComponent(englishTerm)}&2`,
        `https://source.unsplash.com/300x200/?anatomy,${encodeURIComponent(englishTerm)}&3`,
        `https://source.unsplash.com/300x200/?hospital,${encodeURIComponent(englishTerm)}&4`,
        `https://source.unsplash.com/300x200/?doctor,${encodeURIComponent(englishTerm)}&5`,
        `https://source.unsplash.com/300x200/?medicine,${encodeURIComponent(englishTerm)}&6`,
        `https://source.unsplash.com/300x200/?clinic,${encodeURIComponent(englishTerm)}&7`,
        `https://source.unsplash.com/300x200/?biology,${encodeURIComponent(englishTerm)}&8`
      ];
      
      setImages(generatedImages);
      
    } catch (err) {
      setError('حدث خطأ في البحث. تأكد من الاتصال بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  // اقتراحات البحث الطبي
  const medicalSuggestions = [
    'قلب', 'رئة', 'كبد', 'دماغ', 'عظام', 'عضلات', 'جلد', 'عين', 'أذن', 'كلى'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">بحث الصور الطبية</h2>
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
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          
          {/* حالات التحميل والأخطاء */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ البحث عن الصور الطبية...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {!loading && images.length === 0 && query && (
            <div className="text-center py-8">
              <div className="text-gray-600">لم يتم العثور على صور لـ "{query}"</div>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8">
              <div className="text-gray-600">اكتب مصطلحًا طبيًا للبحث عن الصور</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center text-sm text-gray-600">
                تم العثور على {images.length} صورة
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded overflow-hidden shadow-md"
                  >
                    <img
                      src={img}
                      alt={`نتيجة بحث طبية ${idx + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x200/eeeeee/999999?text=صورة+غير+متاحة`;
                      }}
                    />
                    <div className="p-2 text-xs text-gray-700 truncate">
                      {query} - صورة {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;import React, { useState, useEffect, useRef } from 'react';

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
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    'جهاز هضمي': 'digestive system',
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
      setImages([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const translateToEnglish = (arabicQuery: string): string => {
    return medicalTerms[arabicQuery] || arabicQuery;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setImages([]);
    setError('');

    try {
      // ترجمة المصطلح العربي إلى إنجليزي
      const englishTerm = translateToEnglish(query);
      
      // محاكاة جلب الصور (بدلاً من API حقيقي)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // إنشاء صور وهمية بناء على البحث
      const generatedImages = [
        `https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&1`,
        `https://source.unsplash.com/300x200/?health,${encodeURIComponent(englishTerm)}&2`,
        `https://source.unsplash.com/300x200/?anatomy,${encodeURIComponent(englishTerm)}&3`,
        `https://source.unsplash.com/300x200/?hospital,${encodeURIComponent(englishTerm)}&4`,
        `https://source.unsplash.com/300x200/?doctor,${encodeURIComponent(englishTerm)}&5`,
        `https://source.unsplash.com/300x200/?medicine,${encodeURIComponent(englishTerm)}&6`,
        `https://source.unsplash.com/300x200/?clinic,${encodeURIComponent(englishTerm)}&7`,
        `https://source.unsplash.com/300x200/?biology,${encodeURIComponent(englishTerm)}&8`
      ];
      
      setImages(generatedImages);
      
    } catch (err) {
      setError('حدث خطأ في البحث. تأكد من الاتصال بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  // اقتراحات البحث الطبي
  const medicalSuggestions = [
    'قلب', 'رئة', 'كبد', 'دماغ', 'عظام', 'عضلات', 'جلد', 'عين', 'أذن', 'كلى'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">بحث الصور الطبية</h2>
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
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          
          {/* حالات التحميل والأخطاء */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ البحث عن الصور الطبية...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {!loading && images.length === 0 && query && (
            <div className="text-center py-8">
              <div className="text-gray-600">لم يتم العثور على صور لـ "{query}"</div>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8">
              <div className="text-gray-600">اكتب مصطلحًا طبيًا للبحث عن الصور</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center text-sm text-gray-600">
                تم العثور على {images.length} صورة
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded overflow-hidden shadow-md"
                  >
                    <img
                      src={img}
                      alt={`نتيجة بحث طبية ${idx + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x200/eeeeee/999999?text=صورة+غير+متاحة`;
                      }}
                    />
                    <div className="p-2 text-xs text-gray-700 truncate">
                      {query} - صورة {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
