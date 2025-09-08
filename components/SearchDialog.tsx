import React, { useState, useEffect, useRef } from 'react';

// أيقونة X
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
  const [iframeKey, setIframeKey] = useState(0);
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
    setIframeKey(prev => prev + 1);
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const getBingImagesUrl = () => {
    if (!searchTerm) return '';
    return `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 h-4/5 flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">بحث الصور الطبية من Bing</h2>
          <button onClick={onClose} className="p-1 text-white hover:text-blue-200">
            <XIcon className="h-5 w-5"/>
          </button>
        </div>

        {/* شريط البحث */}
        <div className="p-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="ابحث عن أي صورة..."
            className="flex-1 p-2 rounded border border-blue-300"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="px-4 py-2 bg-white text-blue-600 font-bold rounded hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {searchTerm ? (
            <iframe
              key={iframeKey}
              src={getBingImagesUrl()}
              className="w-full h-full border-none"
              title="نتائج البحث من Bing Images"
              sandbox="allow-scripts allow-same-origin allow-popups"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                const target = e.target as HTMLIFrameElement;
                target.style.display = 'none';
                const container = target.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full p-4 text-center">
                      <div class="text-2xl mb-4">⚠️</div>
                      <div class="text-gray-700 font-medium mb-2">تعذر تحميل Bing Images</div>
                      <button onclick="window.open('${getBingImagesUrl()}', '_blank')" 
                              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          فتح في نافذة جديدة
                      </button>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              اكتب مصطلحًا واضغط بحث لرؤية الصور
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
