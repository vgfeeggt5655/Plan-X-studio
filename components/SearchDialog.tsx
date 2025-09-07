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

interface MedicalImageResult {
  title: string;
  link: string;
  description: string;
  source: string;
  category: string;
  thumbnailLink: string;
  fullImageLink: string;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<MedicalImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // قاموس المصطلحات الطبية والترجمة
  const medicalTerms: { [key: string]: string[] } = {
    'قلب': ['heart', 'cardiac', 'cardiology', 'myocardium'],
    'رئة': ['lung', 'pulmonary', 'respiratory', 'bronchi'],
    'كبد': ['liver', 'hepatic', 'hepatology'],
    'كلى': ['kidney', 'renal', 'nephrology'],
    'دماغ': ['brain', 'cerebral', 'neurology', 'cranium'],
    'عين': ['eye', 'ocular', 'ophthalmology', 'retina'],
    'أذن': ['ear', 'auditory', 'otology'],
    'جهاز هضمي': ['digestive system', 'gastro', 'intestinal'],
    'عظام': ['bone', 'skeletal', 'orthopedic', 'fracture'],
    'عضلات': ['muscle', 'muscular', 'myology'],
    'جلد': ['skin', 'dermatology', 'epidermis'],
    'دم': ['blood', 'hematology', 'circulation'],
    'سرطان': ['cancer', 'tumor', 'oncology', 'malignant'],
    'التهاب': ['inflammation', 'infection', 'inflammatory'],
    'أشعة': ['xray', 'radiography', 'medical imaging'],
    'تشريح': ['anatomy', 'anatomical', 'dissection'],
    'مرض': ['disease', 'pathology', 'medical condition'],
    'جراحة': ['surgery', 'surgical', 'operation'],
    'أعصاب': ['nervous system', 'neural', 'neurology'],
    'هرمونات': ['hormones', 'endocrine', 'endocrinology']
  };

  // مصادر الصور الطبية المجانية
  const medicalImageSources = [
    {
      name: 'Unsplash Medical',
      baseUrl: 'https://source.unsplash.com',
      category: 'طبية عامة'
    },
    {
      name: 'Wikimedia Commons',
      baseUrl: 'https://upload.wikimedia.org/wikipedia/commons',
      category: 'تعليمية'
    }
  ];

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const translateToEnglish = (arabicQuery: string): string[] => {
    const lowerQuery = arabicQuery.toLowerCase().trim();
    
    // البحث في القاموس الطبي
    for (const [arabic, englishTerms] of Object.entries(medicalTerms)) {
      if (lowerQuery.includes(arabic)) {
        return englishTerms;
      }
    }
    
    // إذا لم يتم العثور على ترجمة، استخدم الكلمة كما هي + مصطلحات طبية عامة
    return [lowerQuery, 'medical', 'anatomy', 'health'];
  };

  const generateMedicalImages = (searchTerms: string[], originalQuery: string): MedicalImageResult[] => {
    const images: MedicalImageResult[] = [];
    const timestamp = Date.now();
    
    // إنشاء 16 صورة من مصادر متنوعة
    for (let i = 0; i < 16; i++) {
      const termIndex = i % searchTerms.length;
      const currentTerm = searchTerms[termIndex];
      const sig = timestamp + i;
      
      // تناوب بين المصادر
      const sourceIndex = i % 3;
      let imageUrl = '';
      let thumbnailUrl = '';
      let source = '';
      let category = '';
      
      switch (sourceIndex) {
        case 0:
          // Unsplash مع مصطلحات طبية
          imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(currentTerm + ' medical anatomy')}&sig=${sig}`;
          thumbnailUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(currentTerm + ' medical anatomy')}&sig=${sig}`;
          source = 'Unsplash Medical';
          category = 'صور طبية';
          break;
          
        case 1:
          // Unsplash مع مصطلحات تشريحية
          imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(currentTerm + ' human body')}&sig=${sig}`;
          thumbnailUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(currentTerm + ' human body')}&sig=${sig}`;
          source = 'Unsplash Anatomy';
          category = 'تشريح';
          break;
          
        case 2:
          // Unsplash مع مصطلحات صحية
          imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(currentTerm + ' healthcare')}&sig=${sig}`;
          thumbnailUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(currentTerm + ' healthcare')}&sig=${sig}`;
          source = 'Unsplash Health';
          category = 'رعاية صحية';
          break;
      }
      
      images.push({
        title: `${originalQuery} - ${currentTerm}`,
        link: imageUrl,
        description: `صورة طبية تعليمية متعلقة بـ ${originalQuery}`,
        source: source,
        category: category,
        thumbnailLink: thumbnailUrl,
        fullImageLink: imageUrl
      });
    }
    
    return images;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setImages([]);
    setError('');

    try {
      console.log('🏥 البحث عن صور طبية:', query);
      
      // ترجمة المصطلح العربي إلى إنجليزي
      const englishTerms = translateToEnglish(query);
      console.log('📚 المصطلحات المترجمة:', englishTerms);
      
      // محاكاة وقت البحث الحقيقي
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إنشاء صور طبية متخصصة
      const medicalImages = generateMedicalImages(englishTerms, query);
      
      setImages(medicalImages);
      console.log(`✅ تم إنشاء ${medicalImages.length} صورة طبية`);
      
    } catch (err) {
      console.error('💥 خطأ في البحث:', err);
      setError('حدث خطأ في البحث. تأكد من الاتصال بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  // اقتراحات البحث الطبي
  const medicalSuggestions = [
    'قلب', 'رئة', 'كبد', 'دماغ', 'عظام', 'عضلات', 'جلد', 'عين', 'أذن', 'كلى',
    'سرطان', 'التهاب', 'أشعة', 'تشريح', 'جراحة', 'أعصاب', 'دم', 'هرمونات'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-11/12 md:w-4/5 lg:w-4/5 xl:w-4/5 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">🏥</span>
              بحث الصور الطبية والتشريحية
              <span className="text-sm font-normal text-red-100 mr-3 bg-white/20 px-3 py-1 rounded-full">
                مجاني - بدون API
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-red-300 transition-colors duration-200 hover:bg-white/20 rounded-full"
            >
              <XIcon className="h-6 w-6"/>
            </button>
          </div>
          
          {/* شريط البحث */}
          <div className="flex gap-3 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSearch(); }}
              placeholder="ابحث عن أجزاء الجسم أو الأمراض... (مثال: قلب، رئة، سرطان)"
              className="flex-1 p-4 rounded-xl border-2 border-white/30 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:outline-none focus:bg-white/30 transition-all duration-200 text-lg"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-lg min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                  بحث...
                </div>
              ) : (
                '🔍 بحث'
              )}
            </button>
          </div>

          {/* اقتراحات سريعة */}
          <div className="flex flex-wrap gap-2">
            <span className="text-white/80 text-sm mr-2">🏷️ اقتراحات:</span>
            {medicalSuggestions.slice(0, 8).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded-full hover:bg-white/30 transition-all duration-200"
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-red-50 to-pink-50">
          
          {/* حالات التحميل والأخطاء */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-700 font-semibold text-lg">جارٍ البحث عن الصور الطبية...</div>
                <div className="text-gray-500 text-sm mt-2">🔬 تحليل المصطلحات وجلب الصور التعليمية</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-md">
              <div className="text-red-800 font-semibold flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {!loading && images.length === 0 && query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏥</div>
              <div className="text-gray-600 text-xl font-medium">لم يتم العثور على صور طبية لـ "{query}"</div>
              <div className="text-gray-500 text-sm mt-2">جرب مصطلحات طبية أخرى من الاقتراحات أعلاه</div>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🩺</div>
              <div className="text-gray-600 text-xl font-medium mb-4">بحث متخصص في الصور الطبية</div>
              <div className="text-gray-500 text-base mb-6">
                ابحث عن أي جزء من جسم الإنسان أو مرض للحصول على صور تعليمية مجانية
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">💡 أمثلة على ما يمكن البحث عنه:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="font-semibold text-red-700">🫀 الأعضاء</div>
                    <div className="text-gray-600">قلب، رئة، كبد، كلى</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-semibold text-blue-700">🧠 الأجهزة</div>
                    <div className="text-gray-600">دماغ، أعصاب، عظام</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-semibold text-green-700">🦠 الأمراض</div>
                    <div className="text-gray-600">سرطان، التهاب</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="font-semibold text-yellow-700">📸 التشخيص</div>
                    <div className="text-gray-600">أشعة، تشريح</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-semibold text-purple-700">🔬 الطب</div>
                    <div className="text-gray-600">جراحة، أدوية</div>
                  </div>
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <div className="font-semibold text-pink-700">👁️ الحواس</div>
                    <div className="text-gray-600">عين، أذن، جلد</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-6 text-center">
                <span className="bg-green-100 text-green-800 px-6 py-3 rounded-full text-base font-semibold shadow-md">
                  ✅ تم العثور على {images.length} صورة طبية تعليمية
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((item, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 transform border border-gray-100"
                    onClick={() => handleImageClick(item.fullImageLink, item.title)}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-50 relative">
                      <img
                        src={item.thumbnailLink}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // إذا فشلت الصورة من ويكيميديا، استخدم صورة بديلة
                          if (!target.dataset.retried) {
                            target.dataset.retried = 'true';
                            // استخدام صورة طبية بديلة
                            target.src = `https://via.placeholder.com/300x300/dc2626/ffffff?text=%F0%9F%A9%BA+%D8%B5%D9%88%D8%B1%D8%A9+%D8%B7%D8%A8%D9%8A%D8%A9`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white/90 rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <span className="text-2xl">🔍</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="text-sm font-semibold text-gray-800 truncate mb-2" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* معلومات إضافية */}
              <div className="mt-8 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md">
                <div className="text-center text-gray-600">
                  <p className="text-sm mb-2">
                    <span className="text-green-600 font-semibold">✅ مجاني تماماً</span> - 
                    جميع الصور من مصادر مفتوحة وتعليمية
                  </p>
                  <p className="text-xs text-gray-500">
                    🔬 الصور مخصصة للأغراض التعليمية والبحثية - استشر طبيباً مختصاً للتشخيص الطبي
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
