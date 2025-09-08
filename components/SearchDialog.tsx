import React, { useState, useEffect, useRef } from 'react';

// أيقونة X
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// أيقونة البحث
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query);
    setLoading(true);
    // محاكاة عملية التحميل
    setTimeout(() => setLoading(false), 1500);
  };

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'anatomy', name: 'التشريح' },
    { id: 'physiology', name: 'الوظائف' },
    { id: 'diseases', name: 'الأمراض' },
    { id: 'procedures', name: 'الإجراءات' }
  ];

  // صور وهمية للنتائج (في التطبيق الحقيقي، سيتم جلبها من API)
  const sampleResults = [
    { id: 1, title: 'تشريح القلب البشري', category: 'anatomy', url: 'https://example.com/image1.jpg' },
    { id: 2, title: 'دورة الدم في القلب', category: 'physiology', url: 'https://example.com/image2.jpg' },
    { id: 3, title: 'مرض الشريان التاجي', category: 'diseases', url: 'https://example.com/image3.jpg' },
    { id: 4, title: 'قسطرة القلب', category: 'procedures', url: 'https://example.com/image4.jpg' },
    { id: 5, title: 'صمامات القلب', category: 'anatomy', url: 'https://example.com/image5.jpg' },
    { id: 6, title: 'جهاز تنظيم ضربات القلب', category: 'procedures', url: 'https://example.com/image6.jpg' },
  ];

  const filteredResults = activeCategory === 'all' 
    ? sampleResults 
    : sampleResults.filter(item => item.category === activeCategory);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 h-4/5 flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold text-white">البحث عن الصور الطبية</h2>
          <button onClick={onClose} className="p-1 text-white hover:text-blue-200">
            <XIcon className="h-5 w-5"/>
          </button>
        </div>

        {/* شريط البحث */}
        <div className="p-4 flex gap-2 border-b">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="ابحث عن صور طبية..."
              className="w-full p-2 pr-10 rounded border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <SearchIcon className="h-5 w-5 ml-1" />
            بحث
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {searchTerm ? (
            <>
              {/* تصفية النتائج */}
              <div className="p-3 bg-gray-100 flex overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-2 mr-2 whitespace-nowrap rounded-full ${activeCategory === category.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              {/* نتائج البحث */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">جاري البحث عن الصور...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">نتائج البحث عن: "{searchTerm}"</h3>
                      <p className="text-sm text-gray-600">عرض {filteredResults.length} نتيجة</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredResults.map((result) => (
                        <div key={result.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-gray-200 h-40 flex items-center justify-center">
                            <span className="text-gray-500">[صورة]</span>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm mb-1">{result.title}</h4>
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {categories.find(c => c.id === result.category)?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="mb-6">
                <SearchIcon className="h-16 w-16 text-gray-300 mx-auto" />
                <h3 className="text-xl font-medium text-gray-700 mt-4">ابحث عن الصور الطبية</h3>
                <p className="text-gray-500 mt-2">استخدم شريط البحث أعلاه للعثور على صور طبية من قاعدة بياناتنا</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-700">القلب</div>
                  <div className="text-xs text-blue-500 mt-1">تشريح ووظائف</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="font-medium text-green-700">الدماغ</div>
                  <div className="text-xs text-green-500 mt-1">هيكل وأمراض</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="font-medium text-purple-700">العظام</div>
                  <div className="text-xs text-purple-500 mt-1">هيكل عظمي</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="font-medium text-orange-700">العضلات</div>
                  <div className="text-xs text-orange-500 mt-1">أنسجة عضلية</div>
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
