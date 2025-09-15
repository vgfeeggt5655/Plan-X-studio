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
  const [isClosing, setIsClosing] = useState(false);

  // Animation and Body Scroll Logic
  useEffect(() => {
    if (open) {
      setShowDialog(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsClosing(true);
      // Delay unmounting until animation is complete
      const timer = setTimeout(() => setShowDialog(false), 300);
      return () => clearTimeout(timer);
    }
    // Cleanup for body scroll
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    // Call onClose prop after animation
    setTimeout(() => onClose(), 300);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  if (!showDialog && !isClosing) return null;

  return (
    <div className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className={`bg-background border border-border-color rounded-lg shadow-2xl w-11/12 md:w-5/6 lg:w-4/5 h-5/6 flex flex-col overflow-hidden transform transition-all duration-300 ${isClosing ? 'animate-dialog-out' : 'animate-dialog-in'}`}
      >
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-text-primary">Image Search</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-600 transition">
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
              sandbox="allow-scripts allow-same-origin allow-popups"
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
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dialog-out {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        .animate-dialog-in {
          animation: dialog-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-dialog-out {
          animation: dialog-out 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchDialog;
