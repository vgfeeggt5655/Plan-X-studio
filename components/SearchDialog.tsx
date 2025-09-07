import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';
import Fuse from 'fuse.js';

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

const medicalTerms = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Cancer",
  "Heart Disease",
  "Stroke",
  "Migraine",
  "Arthritis",
  "Alzheimer's Disease",
  "Parkinson's Disease",
  "COVID-19",
  // ... ممكن تضيف باقي المصطلحات الطبية هنا
];

const fuse = new Fuse(medicalTerms, { threshold: 0.3 });

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

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    try {
      // تصحيح الكلمة باستخدام fuse.js
      let searchTerm = query;
      const fuseResult = fuse.search(query);
      if (fuseResult.length > 0) {
        searchTerm = fuseResult[0].item;
      }

      // جلب البيانات من Wikipedia API
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`);
      const data = await res.json();

      const image = data.thumbnail?.source || '';
      const description = data.extract || 'No description available.';

      setResults([{
        title: data.title,
        description,
        image,
        famousCases: [] // ممكن تضيف بيانات ثابتة أو API خارجي لاحقًا
      }]);
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
              <div
                key={idx}
                onClick={() => setSelectedResult(res)}
                className="flex flex-col md:flex-row gap-4 border border-border-color rounded-md p-3 hover:shadow-md transition cursor-pointer"
              >
                {res.image && (
                  <img src={res.image} alt={res.title} className="w-full md:w-40 h-40 object-cover rounded-md" />
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">{res.title}</h3>
                  <p className="text-text-secondary mt-1">{res.description}</p>
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
          {selectedResult ? (
            <>
              <h3 className="text-lg font-semibold mb-2">{selectedResult.title}</h3>
              <p className="text-text-secondary text-sm">{selectedResult.description}</p>
              {selectedResult.famousCases && selectedResult.famousCases.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-text-primary">Famous cases:</h4>
                  <div className="flex gap-2 mt-1">
                    {selectedResult.famousCases.map((person, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />
                        <span className="text-sm text-text-secondary">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
              <p className="text-text-secondary text-sm">
                Select a result on the left to see a brief description and any famous cases here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
