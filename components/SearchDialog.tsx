import React, { useState, useEffect, useRef } from 'react';

// ... (الأيقونة والأنواع كما هي)

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
      
      // محاكاة جلب الصور (بدلاً من الاتصال بجوجل مباشرة)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إنشاء صور من Unsplash (بديل عن جوجل)
      const generatedImages = [];
      const count = 16;
      
      for (let i = 1; i <= count; i++) {
        generatedImages.push(`https://source.unsplash.com/300x200/?medical,${encodeURIComponent(englishTerm)}&sig=${i}`);
      }
      
      setImages(generatedImages);
    } catch (err) {
      console.error('خطأ في البحث:', err);
    } finally {
      setLoading(false);
    }
  };

  // ... (باقي الكود مشابه للحلول السابقة)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4">
          {/* ... (شريط البحث والاقتراحات كما هي) */}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">جارٍ البحث عن الصور الطبية...</div>
              </div>
            </div>
          )}
          
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center text-sm text-gray-600">
                تم العثور على {images.length} صورة لـ "{query}"
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
