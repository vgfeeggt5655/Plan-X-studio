import React, { useState, useRef } from 'react';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 md:w-5/6 lg:w-4/5 h-5/6 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-600">
          <h2 className="text-xl font-bold text-white">بحث الصور</h2>
          <button onClick={onClose} className="p-1 text-white hover:text-gray-200">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex p-4 border-b border-gray-300">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="ابحث عن أي صورة..."
            className="flex-1 p-2 rounded border border-gray-300"
          />
          <button
            onClick={handleSearch}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            بحث
          </button>
        </div>

        {/* Bing Images */}
        <div className="flex-1 overflow-hidden">
          {searchTerm ? (
            <iframe
              key={iframeKey}
              src={bingImagesUrl}
              className="w-full h-full border-none"
              title="Bing Images Search"
              sandbox="allow-scripts allow-same-origin allow-popups"
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
