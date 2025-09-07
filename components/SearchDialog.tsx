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

interface GoogleImageResult {
  title: string;
  link: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<GoogleImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Google Custom Search API - المفاتيح الحقيقية
  const GOOGLE_API_KEY = 'AIzaSyCdXXo2NHpQJdxY4-t6ZcuCROgQRAFdznk';
  const SEARCH_ENGINE_ID = '335e910ac021b44bf';

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setError('');
      setSearchSource('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setImages([]);
    setError('');
    setSearchSource('');

    try {
      console.log('🔍 البحث في Google Images عن:', query);
      
      // بناء رابط Google Custom Search API
      const searchParams = new URLSearchParams({
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        searchType: 'image',
        num: '12',
        safe: 'active',
        imgSize: 'medium',
        imgType: 'photo',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial,cc_nonderived'
      });

      const searchUrl = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
      
      console.log('📡 استدعاء Google API...');
      const response = await fetch(searchUrl);
      const data = await response.json();

      console.log('📊 استجابة Google API:', data);

      if (data.error) {
        console.error('❌ خطأ في Google API:', data.error);
        throw new Error(`Google API Error: ${data.error.message}`);
      }

      if (data.items && data.items.length > 0) {
        console.log(`✅ تم العثور على ${data.items.length} صورة من Google`);
        
        const googleImages: GoogleImageResult[] = data.items.map((item: any, index: number) => {
          console.log(`صورة ${index + 1}:`, {
            title: item.title,
            link: item.link,
            thumbnail: item.image?.thumbnailLink
          });

          return {
            title: item.title || `${query} - صورة ${index + 1}`,
            link: item.link,
            image: {
              contextLink: item.image?.contextLink || item.displayLink || '#',
              height: item.image?.height || 400,
              width: item.image?.width || 600,
              byteSize: item.image?.byteSize || 0,
              thumbnailLink: item.image?.thumbnailLink || item.link,
              thumbnailHeight: item.image?.thumbnailHeight || 200,
              thumbnailWidth: item.image?.thumbnailWidth || 300
            }
          };
        });
        
        setImages(googleImages);
        setSearchSource('Google Images');
        return;

      } else {
        console.log('⚠️ لم يتم العثور على صور في Google');
        throw new Error('لم يتم العثور على صور لهذا المصطلح');
      }

    } catch (err) {
      console.error('💥 خطأ في البحث:', err);
      
      // استخدام صور تجريبية كبديل
      console.log('🔄 التبديل إلى الصور التجريبية...');
      
      try {
        const fallbackImages: GoogleImageResult[] = [];
        
        for (let i = 0; i < 12; i++) {
          const useUnsplash = i % 3 !== 2; // استخدم Unsplash في معظم الحالات
          let imageUrl = '';
          let thumbnailUrl = '';
          let sourceTitle = '';
          
          if (useUnsplash) {
            const queryParam = encodeURIComponent(query);
            const timestamp = Date.now();
            const sig = i + timestamp;
            imageUrl = `https://source.unsplash.com/800x600/?${queryParam}&sig=${sig}`;
            thumbnailUrl = `https://source.unsplash.com/400x300/?${queryParam}&sig=${sig}`;
            sourceTitle = `${query} - Unsplash ${i + 1}`;
          } else {
            const randomId = 1000 + (i * 100) + Math.floor(Math.random() * 100);
            imageUrl = `https://picsum.photos/800/600?random=${randomId}`;
            thumbnailUrl = `https://picsum.photos/400/300?random=${randomId}`;
            sourceTitle = `صورة عشوائية - Picsum ${i + 1}`;
          }

          fallbackImages.push({
            title: sourceTitle,
            link: imageUrl,
            image: {
              contextLink: imageUrl,
              height: 600,
              width: 800,
              byteSize: 0,
              thumbnailLink: thumbnailUrl,
              thumbnailHeight: 300,
              thumbnailWidth: 400
            }
          });
        }
        
        setImages(fallbackImages);
        setSearchSource('Unsplash + Picsum (صور تجريبية)');
        setError('تم استخدام صور تجريبية - Google API غير متاح حالياً');
        
      } catch (fallbackErr) {
        console.error('💥 خطأ في الصور التجريبية:', fallbackErr);
        setError('حدث خطأ في البحث. تأكد من الاتصال بالإنترنت.');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-11/12 md:w-4/5 lg:w-4/5 xl:w-3/4 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">🔍</span>
              بحث صور Google
              {searchSource && (
                <span className="text-sm font-normal text-blue-100 mr-2 bg-white/20 px-2 py-1 rounded-full">
                  {searchSource}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-red-300 transition-colors duration-200 hover:bg-white/20 rounded-full"
            >
              <XIcon className="h-6 w-6"/>
            </button>
          </div>
          
          {/* شريط البحث */}
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSearch(); }}
              placeholder="ابحث عن صور... (مثال: قطط، طبيعة، تكنولوجيا)"
              className="flex-1 p-4 rounded-xl border-2 border-white/30 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:outline-none focus:bg-white/30 transition-all duration-200 text-lg"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-lg min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  بحث...
                </div>
              ) : (
                '🔍 بحث'
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
          
          {/* حالات التحميل والأخطاء */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-700 font-semibold text-lg">جارٍ البحث في Google Images...</div>
                <div className="text-gray-500 text-sm mt-2">قد يستغرق هذا بضع ثوان</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6 shadow-md">
              <div className="text-yellow-800 font-semibold flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                {error}
              </div>
              {error.includes('تجريبية') && (
                <div className="text-yellow-700 text-sm mt-3 bg-yellow-100 p-3 rounded-md">
                  <p className="flex items-center">
                    <span className="text-lg mr-2">💡</span>
                    يتم عرض صور عالية الجودة من Unsplash و صور عشوائية من Picsum
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && !error && images.length === 0 && query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-gray-600 text-xl font-medium">لم يتم العثور على صور لـ "{query}"</div>
              <div className="text-gray-500 text-sm mt-2">جرب كلمات بحث مختلفة أو أكثر عمومية</div>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📸</div>
              <div className="text-gray-600 text-xl font-medium">ابدأ البحث عن صور</div>
              <div className="text-gray-500 text-sm mt-2">اكتب في مربع البحث أعلاه للعثور على صور من Google</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div>
              <div className="mb-4 text-center">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  ✅ تم العثور على {images.length} صورة
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {images.map((item, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 transform"
                    onClick={() => handleImageClick(item.link, item.title)}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.image.thumbnailLink || item.link}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('placeholder')) {
                            target.src = `https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=صورة+غير+متاحة`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-2xl">
                          👁️
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-700 truncate font-medium" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                        <span>{item.image.width} × {item.image.height}</span>
                        <span className="text-green-600">🔗</span>
                      </div>
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
