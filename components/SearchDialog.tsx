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

interface MedicalImage {
  id: number;
  title: string;
  source: string;
  url: string;
  thumbnail: string;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<MedicalImage[]>([]);
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

    try {
      // ترجمة المصطلح العربي إلى إنجليزي
      const englishTerm = translateToEnglish(query);
      
      // محاكاة وقت البحث (بدلاً من الاتصال بجوجل)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إنشاء صور عشوائية بناء على البحث من Unsplash
      const generatedImages: MedicalImage[] = [];
      const count = Math.floor(Math.random() * 10) + 15; // بين 15 و 25 صورة
      
      for (let i = 1; i <= count; i++) {
        generatedImages.push({
          id: i,
          title: `${query} - صورة ${i}`,
          source: 'مصدر طبي',
          url: `https://source.unsplash.com/600x400/?medical,${encodeURIComponent(englishTerm)}&sig=${i}`,
          thumbnail: `https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&sig=${i}`
        });
      }
      
      setImages(generatedImages);
    } catch (err) {
      console.error('خطأ في البحث:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  // اقتراحات البحث الطبي
  const medicalSuggestions = [
    'قلب', 'رئة', 'كبد', 'دماغ', 'عظام', 'عضلات', 'جلد', 'عين', 'أذن', 'كلى'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 max-h-[90vh] overflow-hidden flex flex-col">
        
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
                onClick={() => {
                  setQuery(suggestion);
                  if (open) handleSearch();
                }}
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
          
          {/* حالات التحميل */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ البحث عن الصور الطبية...</div>
              </div>
            </div>
          )}
          
          {/* لا توجد نتائج */}
          {!loading && images.length === 0 && query && (
            <div className="text-center py-8">
              <div className="text-gray-600">لم يتم العثور على صور لـ "{query}"</div>
            </div>
          )}
          
          {/* حالة البدء */}
          {!loading && images.length === 0 && !query && (
            <div className="text-center py-8">
              <div className="text-gray-500">اكتب مصطلحًا طبيًا للبحث عن الصور</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center text-sm text-gray-600">
                تم العثور على {images.length} صورة لـ "{query}"
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="bg-white rounded overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleImageClick(image.url)}
                  >
                    <div className="w-full h-40 overflow-hidden">
                      <img
                        src={image.thumbnail}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/300x200/eeeeee/999999?text=صورة+غير+متاحة`;
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-sm font-medium text-gray-800 truncate">{image.title}</div>
                      <div className="text-xs text-gray-500">{image.source}</div>
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
