import React, { useState, useRef, useEffect, useCallback } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // لمنع التمرير في الصفحة الرئيسية عند فتح الديالوج
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Focus on the input field
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [open]);

  // لإغلاق الديالوج عند الضغط خارج المساحة المحددة أو بضغطة Esc
  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleOutsideClick, handleKeyDown]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end justify-center md:items-center p-0 md:p-4 transition-all duration-300"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border-color rounded-t-lg md:rounded-lg shadow-2xl w-full h-full md:w-5/6 lg:w-4/5 md:h-5/6 flex flex-col overflow-hidden transform transition-all duration-300 animate-slide-up md:animate-zoom-in"
      >
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-text-primary">Image Search</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-600 transition">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Search Bar */}
        <div className="flex p-4 border-b border-border-color flex-shrink-0 gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Type any keyword and press Enter..."
            className="flex-1 bg-surface text-text-primary border border-border-color rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 bg-primary text-background rounded-lg hover:bg-cyan-400 shadow-md transition hover:scale-105 text-base"
          >
            Search
          </button>
        </div>

        {/* Bing Images */}
        <main className="flex-1 overflow-y-auto">
          {searchTerm ? (
            <iframe
              key={iframeKey}
              src={bingImagesUrl}
              className="w-full h-full border-none"
              title="Bing Images Search"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">
              Enter a keyword to see images
            </div>
          )}
        </main>
      </div>
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes zoom-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-zoom-in {
          animation: zoom-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchDialog;
