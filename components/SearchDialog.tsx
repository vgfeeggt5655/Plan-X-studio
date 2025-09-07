import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = () => {
    if (!query) return;
    // فتح بحث Google Images في نافذة جديدة
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] flex flex-col p-4">
        
        {/* Search bar */}
        <div className="flex mb-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search images..."
            className="flex-1 p-2 rounded-l-md border border-white/50 focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-primary text-white rounded-r-md hover:bg-primary/90 transition"
          >
            Search
          </button>
          <button
            onClick={onClose}
            className="ml-2 p-2 text-white hover:text-red-500 transition"
          >
            <XIcon className="h-5 w-5"/>
          </button>
        </div>

        <p className="text-white text-center mt-4">
          سيتم فتح نتائج البحث في نافذة جديدة.
        </p>
      </div>
    </div>
  );
};

export default SearchDialog;
