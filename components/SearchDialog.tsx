import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const GOOGLE_API_KEY = 'AIzaSyCdXXo2NHpQJdxY4-t6ZcuCROgQRAFdznk';
  const SEARCH_ENGINE_ID = '335e910ac021b44bf';

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setImages([]);
    try {
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodeURIComponent(query)}&num=10`
      );
      const data = await res.json();
      
      if (!data.items || data.items.length === 0) {
        setImages([]);
        return;
      }

      const imgs: string[] = data.items.map((item: any) => item.link);
      setImages(imgs);
    } catch (err) {
      console.error('Google API error:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-xl w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col p-4">
        
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

        {/* Images */}
        {loading && <div className="text-center text-white">Loading...</div>}
        {!loading && images.length === 0 && <div className="text-center text-white">No images found</div>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt={`img-${idx}`} className="w-full h-40 object-cover rounded-md"/>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
