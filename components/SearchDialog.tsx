import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Result {
  title: string;
  description: string;
  image?: string;
  famousCases?: { name: string; image: string }[];
}

// بيانات ثابتة للشرح والأشخاص المشهورين
const medicalInfo: Record<string, { description: string; famousCases: { name: string; image: string }[] }> = {
  "Heart Disease": {
    description: "Heart disease refers to various types of heart conditions that affect the heart’s structure and function.",
    famousCases: [
      { name: "Arnold Schwarzenegger", image: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Arnold_Schwarzenegger_2019.jpg" },
      { name: "Larry King", image: "https://upload.wikimedia.org/wikipedia/commons/7/74/Larry_King_2009.jpg" }
    ]
  },
  "Diabetes": {
    description: "Diabetes is a chronic health condition that affects how your body turns food into energy.",
    famousCases: [
      { name: "Tom Hanks", image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Tom_Hanks_TIFF_2019.jpg" }
    ]
  },
  // ممكن تضيف باقي الأمراض بنفس الشكل
};

const PIXABAY_KEY = "52176231-bd0707f83e7695350a4ae0672";

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedResult(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const fetchImages = async (term: string) => {
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(term)}&image_type=photo&category=health&per_page=20&order=latest`
      );
      const data = await res.json();
      return data.hits.map((hit: any) => hit.largeImageURL);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const term = query; // ممكن تضيف هنا ترجمة لو العربي
      const images = await fetchImages(term);
      const info = medicalInfo[term] || { description: "No description available.", famousCases: [] };
      const resultsData = images.map(img => ({
        title: term,
        description: info.description,
        image: img,
        famousCases: info.famousCases
      }));
      setResults(resultsData);
      setSelectedResult(resultsData[0] || null);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-xl w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/20">
        
        {/* Left: Search and results */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search medical terms..."
              className="w-full p-2 rounded-md border border-white/50 bg-white/20 placeholder-white text-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Search
            </button>
            <button
              onClick={onClose}
              className="absolute right-16 top-2 p-1 text-white hover:text-red-500 transition"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {loading && <div className="text-center text-white">Loading...</div>}
          {!loading && results.length === 0 && query && (
            <div className="text-center text-white">No results found.</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((res, idx) => (
              <img
                key={idx}
                src={res.image}
                alt={res.title}
                className="w-full h-40 object-cover rounded-md cursor-pointer hover:scale-105 transition"
                onClick={() => setSelectedResult(res)}
              />
            ))}
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="hidden md:block w-1/3 p-4 overflow-y-auto bg-white/20 backdrop-blur-md border-l border-white/20">
          {selectedResult ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">{selectedResult.title}</h3>
              <p className="text-white text-sm">{selectedResult.description}</p>
              {selectedResult.famousCases && selectedResult.famousCases.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-white">Famous cases:</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {selectedResult.famousCases.map((person, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />
                        <span className="text-sm text-white">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Info</h3>
              <p className="text-white text-sm">Select a result on the left to see a brief description and any famous cases here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
