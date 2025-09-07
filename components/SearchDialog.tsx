import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  name: string;
  description: string;
  famousCases?: { name: string; image: string }[];
  image: string;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    // هنا هتستبدل الـ API بالكود بتاع البحث الطبي الحقيقي
    try {
      const response = await fetch(`https://api.example.com/medical-search?q=${query}&lang=en`);
      let data: SearchResult[] = await response.json();

      // Simple typo correction logic (like Google)
      if (data.length === 0) {
        const correctedQuery = query.split(' ').map(word => word).join(' '); // ممكن تضيف مكتبة تصحيح هنا
        const fallbackResponse = await fetch(`https://api.example.com/medical-search?q=${correctedQuery}&lang=en`);
        data = await fallbackResponse.json();
      }

      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-lg w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Left: Search and results */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search medical terms..."
              className="w-full p-2 rounded-md border border-border-color focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Search
            </button>
            <button onClick={onClose} className="p-2 text-text-secondary hover:text-red-500 transition">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {loading && <div className="text-center text-text-secondary">Loading...</div>}

          {!loading && results.length === 0 && query && (
            <div className="text-center text-text-secondary">No results found.</div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {results.map((res, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 border border-border-color rounded-md p-3 hover:shadow-md transition">
                <img src={res.image} alt={res.name} className="w-full md:w-40 h-40 object-cover rounded-md" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{res.name}</h3>
                    <p className="text-text-secondary mt-1">{res.description}</p>
                  </div>
                  {res.famousCases && res.famousCases.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-medium text-text-primary">Famous cases:</h4>
                      <div className="flex gap-2 mt-1">
                        {res.famousCases.map((person, i) => (
                          <div key={i} className="flex flex-col items-center text-center">
                            <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />
                            <span className="text-sm text-text-secondary">{person.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick info panel */}
        <div className="hidden md:block w-1/3 bg-gray-50 p-4 border-l border-border-color overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
          <p className="text-text-secondary text-sm">
            When you select a search result, a brief description of the disease or organ will appear here. Images and famous cases are also displayed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
