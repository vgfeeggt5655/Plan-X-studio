import React, { useState, useRef, useEffect } from 'react';

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
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setShowDialog(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setShowDialog(false);
    }
  }, [open]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  return (
    <>
      {showDialog && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`bg-white rounded-xl shadow-2xl w-11/12 md:w-5/6 lg:w-4/5 h-5/6 flex flex-col overflow-hidden transform transition-transform duration-300 ${
              open ? 'translate-y-0' : 'translate-y-10'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-blue-500">
              <h2 className="text-xl font-bold text-white">Image Search</h2>
              <button
                onClick={onClose}
                className="p-1 text-white hover:text-gray-200 transition-transform duration-200 hover:scale-110"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex p-4 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Type any keyword and press Enter..."
                className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                onClick={handleSearch}
                className="ml-3 px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-transform duration-200 hover:scale-105"
              >
                Search
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
                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                  Enter a keyword to see images
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDialog;
