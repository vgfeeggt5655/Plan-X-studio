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
  const inputRef = useRef<HTMLInputElement>(null);

  // ضع هنا Google API Key و Custom Search Engine ID
  const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
  const SEARCH_ENGINE_ID = 'YOUR_SEARCH_ENGINE_ID';

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY') {
      setError('يرجى إضافة Google API Key في الكود');
      return;
    }

    setLoading(true);
    setImages([]);
    setError('');

    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=12&safe=active`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'خطأ في البحث');
      }

      if (data.items && data.items.length > 0) {
        setImages(data.items);
      } else {
        setError('لم يتم العثور على صور');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('حدث خطأ أثناء البحث');
      
      // في حالة عدم وجود API key، استخدم صور تجريبية
      if (GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY') {
        const demoImages: GoogleImageResult[] = [];
        for (let i = 0; i < 12; i++) {
          demoImages.push({
            title: `${query} - صورة ${i + 1}`,
            link: `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}&sig=${i}`,
            image: {
              contextLink: '#',
              height: 400,
              width: 600,
              byteSize: 0,
              thumbnailLink: `https://source.unsplash.com/300x200/?${encodeURIComponent(query)}&sig=${i}`,
              thumbnailHeight: 200,
              thumbnailWidth: 300
            }
          });
        }
        setImages(demoImages);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    // يمكنك إضافة وظائف إضافية هنا مثل:
    // - نسخ رابط الصورة
    // - فتح الصورة في نافذة جديدة
    // - حفظ الصورة
    window.open(imageUrl, '_blank');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-11/12 md:w-4/5 lg:w-4/5 xl:w-3/4 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="text-2xl mr-2">🔍</span>
              بحث صور Google
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-red-300 transition-colors duration-200 hover:bg-white/20 rounded-full"
            >
              <XIcon className="h-5 w-5"/>
            </button>
          </div>
          
          {/* شريط البحث */}
          <div className="flex mt-4 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="ابحث عن صور..."
              className="flex-1 p-3 rounded-lg border-2 border-white/30 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white focus:outline-none focus:bg-white/30 transition-all duration-200"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? 'جارٍ البحث...' : 'بحث'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* رسائل الحالة */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">جارٍ البحث في صور جوجل...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-700 font-medium">{error}</div>
              <div className="text-red-600 text-sm mt-2">
                <p>💡 <strong>نصيحة:</strong> للحصول على صور حقيقية من Google Images:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs mt-2">
                  <li>احصل على Google Custom Search API key</li>
                  <li>أو استخدم Unsplash API (مجاني) من <span className="font-mono bg-gray-100 px-1">unsplash.com/developers</span></li>
                </ol>
              </div>
            </div>
          )}

          {!loading && !error && images.length === 0 && query && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">لم يتم العثور على صور لـ "{query}"</div>
              <div className="text-gray-400 text-sm mt-2">جرب كلمات بحث مختلفة</div>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">اكتب في مربع البحث للبدء</div>
            </div>
          )}

          {/* عرض الصور */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((item, idx) => (
                <div
                  key={idx}
                  className="group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => handleImageClick(item.link, item.title)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={item.image.thumbnailLink || item.link}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x300/e5e7eb/9ca3af?text=صورة+غير+متاحة`;
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-gray-600 truncate" title={item.title}>
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.image.width} × {item.image.height}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
