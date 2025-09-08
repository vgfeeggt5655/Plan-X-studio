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

// مثال بيانات للأشخاص حسب المرض
const mockFamousPeople: Record<string, { arab: string[], foreign: string[] }> = {
  "مرض السكري": {
    arab: ["محمد صلاح", "أحمد حلمي"],
    foreign: ["Tom Hanks", "Halle Berry"]
  },
  "السرطان": {
    arab: ["رياض محرز"],
    foreign: ["Angelina Jolie", "Robert De Niro"]
  }
};

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  if (!open) return null;

  // جلب الأشخاص
  const people = mockFamousPeople[searchTerm] || { arab: [], foreign: [] };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-11/12 md:w-4/5 h-4/5 flex overflow-hidden">

        {/* قسم البحث + صور */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-300">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="اكتب اسم المرض واضغط بحث..."
              className="flex-1 p-2 border border-gray-300 rounded mr-2"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              بحث
            </button>
            <button onClick={onClose} className="p-1 text-gray-700 hover:text-black ml-2">
              <XIcon className="h-6 w-6"/>
            </button>
          </div>

          <iframe
            key={iframeKey}
            src={bingImagesUrl}
            className="flex-1 w-full border-none"
            title="Bing Images Search"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        {/* قسم الأشخاص */}
        <div className="w-64 bg-gray-100 p-4 overflow-y-auto border-l border-gray-300">
          <h3 className="font-bold mb-2">أشهر الأشخاص المصابين</h3>

          {people.arab.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">العرب</h4>
              <ul className="mb-4 list-disc list-inside">
                {people.arab.map((name, i) => <li key={`arab-${i}`}>{name}</li>)}
              </ul>
            </>
          )}

          {people.foreign.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">الأجانب</h4>
              <ul className="list-disc list-inside">
                {people.foreign.map((name, i) => <li key={`foreign-${i}`}>{name}</li>)}
              </ul>
            </>
          )}

          {people.arab.length === 0 && people.foreign.length === 0 && (
            <p className="text-gray-500 text-sm">لا توجد معلومات متاحة.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchDialog;
