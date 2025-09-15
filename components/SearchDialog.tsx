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
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // لمنع التمرير في الصفحة الرئيسية عند فتح الديالوج
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setIsOpening(true);
      setIsClosing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsClosing(true);
      setIsOpening(false);
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300); // المدة تتطابق مع مدة حركة الإغلاق

      return () => clearTimeout(timer);
    }
  }, [open]);

  // لإغلاق الديالوج عند الضغط خارج المساحة المحددة
  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, handleOutsideClick]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  if (!open && !isClosing) return null;

  const animationClass = isOpening
    ? 'animate-dialog-in'
    : isClosing
    ? 'animate-dialog-out'
    : '';

  return (
    <div
      className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isOpening ? 'opacity-100' : isClosing ? 'opacity-0' : ''}`}
      style={{ pointerEvents: isClosing ? 'none' : 'auto' }}
    >
      <div
        ref={dialogRef}
        className={`bg-background border border-border-color rounded-lg shadow-2xl w-11/12 md:w-5/6 lg:w-4/5 h-5/6 flex flex-col overflow-hidden transform transition-all duration-300 ${animationClass}`}
        onAnimationEnd={() => {
          if (isClosing) {
            // للتأكد من إخفاء المكون تماما بعد انتهاء حركة الإغلاق
            onClose();
          }
        }}
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
            className="flex-1 bg-surface text-text-primary border border-border-color rounded-lg p-3 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 bg-primary text-background rounded-lg hover:bg-cyan-400 shadow-md transition hover:scale-105 text-base md:text-lg"
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
            <div className="flex items-center justify-center h-full text-gray-400 text-lg md:text-xl">
              Enter a keyword to see images
            </div>
          )}
        </main>
      </div>
      <style>{`
        @keyframes dialog-in {
          0% { transform: scale(0.95) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes dialog-out {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.95) translateY(10px); opacity: 0; }
        }
        .animate-dialog-in {
          animation: dialog-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-dialog-out {
          animation: dialog-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchDialog;
