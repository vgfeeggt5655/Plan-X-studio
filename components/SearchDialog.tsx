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

interface WikipediaImage {
  title: string;
  thumbnail: {
    source: string;
    width: number;
    height: number;
  };
  pageimage: string;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<WikipediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // قاموس المصطلحات الطبية والترجمة
  const medicalTerms: { [key: string]: string } = {
    'قلب': 'Heart',
    'رئة': 'Lung',
    'كبد': 'Liver',
    'كلى': 'Kidney',
    'دماغ': 'Brain',
    'عين': 'Eye',
    'أذن': 'Ear',
    'جهاز هضمي': 'Digestive system',
    'عظام': 'Bone',
    'عضلات': 'Muscle',
    'جلد': 'Skin',
    'دم': 'Blood',
    'سرطان': 'Cancer',
    'التهاب': 'Inflammation',
    'أشعة': 'Radiography',
    'تشريح': 'Anatomy',
    'مرض': 'Disease',
    'جراحة': 'Surgery',
    'أعصاب': 'Nerve',
    'هرمونات': 'Hormone'
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

  const fetchWikipediaImages = async (term: string) => {
    try {
      const englishTerm = translateToEnglish(term);
      
      // استخدام ويكيميديا API للحصول على الصور
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(englishTerm)}&gsrnamespace=6&prop=pageimages|info&pithumbsize=300&format=json&origin=*`
      );
      
      if (!response.ok) {
        throw new Error('فشل في جلب الصور من ويكيميديا');
      }
      
      const data = await response.json();
      
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as WikipediaImage[];
        return pages.filter(page => page.thumbnail);
      }
      
      return [];
    } catch (err) {
      console.error('خطأ في جلب الصور:', err);
      throw new Error('تعذر الاتصال بخادم ويكيميديا');
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setImages([]);
    setError('');

    try {
      const wikipediaImages = await fetchWikipediaImages(query);
      
      if (wikipediaImages.length === 0) {
        setError('لم يتم العثور على صور لهذا المصطلح في ويكيميديا');
      } else {
        setImages(wikipediaImages);
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageTitle: string) => {
    window.open(`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(imageTitle)}`, '_blank');
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
            <h2 className="text-xl font-bold text-white">بحث الصور الطبية من ويكيميديا</h2>
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
          
          {/* حالات التحميل */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ البحث في ويكيميديا...</div>
              </div>
            </div>
          )}
          
          {/* رسائل الخطأ */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* لا توجد نتائج */}
          {!loading && images.length === 0 && query && !error && (
            <div className="text-center py-8">
              <div className="text-gray-600">لم يتم العثور على صور لـ "{query}"</div>
            </div>
          )}
          
          {/* حالة البدء */}
          {!loading && images.length === 0 && !query && (
            <div className="text-center py-8">
              <div className="text-gray-500">اكتب مصطلحًا طبيًا للبحث عن الصور في ويكيميديا</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center text-sm text-gray-600">
                تم العثور على {images.length} صورة لـ "{query}" في ويكيميديا
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="bg-white rounded overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleImageClick(image.title)}
                  >
                    <div className="w-full h-40 overflow-hidden">
                      <img
                        src={image.thumbnail.source}
                        alt={image.title.replace('File:', '')}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/300x200/eeeeee/999999?text=صورة+غير+متاحة`;
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {image.title.replace('File:', '').replace(/\.[^/.]+$/, '')}
                      </div>
                      <div className="text-xs text-gray-500">ويكيميديا كومنز</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* معلومات إضافية */}
              <div className="mt-4 text-center text-xs text-gray-500">
                الصور من ويكيميديا كومنز - انقر على الصورة للذهاب إلى صفحة الصورة الأصلية
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
