import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Result {
  title: string;
  description: string;
  images: string[];
  famousCases?: { name: string; image: string }[];
}

// قاعدة بيانات صغيرة لأشهر الناس
const famousCasesDB: Record<string, { name: string; image: string }[]> = {
  'Heart Disease': [
    { name: 'Donald Trump', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Donald_Trump_official_portrait.jpg' }
  ],
  'Diabetes': [
    { name: 'Tom Hanks', image: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Tom_Hanks_TIFF_2019.jpg' }
  ],
  'Stroke': [
    { name: 'Sharon Stone', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Sharon_Stone_2013.jpg' }
  ]
  // ممكن تزود باقي الأمراض
};

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const GOOGLE_API_KEY = 'AIzaSyA-D4x8MwvRumSY-lqBKlTfzoYlJMgUghY';
  const SEARCH_ENGINE_ID = '335e910ac021b44bf';

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const translateToEnglish = async (text: string) => {
    try {
      const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ q: text, target: 'en' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return data.data.translations[0].translatedText;
    } catch {
      return text; // fallback
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const searchTerm = await translateToEnglish(query);

      // fetch main description
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`);
      const wikiData = await wikiRes.json();
      const description = wikiData.extract || 'No description available.';

      // fetch images from Google Custom Search
      const imageRes = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodeURIComponent(searchTerm)}&num=10`
      );
      const imageData = await imageRes.json();
      const images: string[] = (imageData.items || []).map((item: any) => item.link);

      setResults({
        title: wikiData.title,
        description,
        images,
        famousCases: famousCasesDB[wikiData.title] || []
      });
    } catch (err) {
      console.error(err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-xl w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/20">
        
        {/* Left: Images */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search medical term or body part..."
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

          {loading && <div className="col-span-full text-center text-white">Loading...</div>}

          {results && results.images.length === 0 && <div className="col-span-full text-center text-white">No images found</div>}

          {results?.images.map((img, idx) => (
            <img key={idx} src={img} alt={results.title} className="w-full h-40 object-cover rounded-md"/>
          ))}
        </div>

        {/* Right: Description + famous cases */}
        <div className="hidden md:flex md:flex-col w-1/3 bg-white/20 backdrop-blur-lg p-4 border-l border-white/30 overflow-y-auto">
          {loading && <div className="text-white">Loading info...</div>}
          {results && (
            <>
              <h3 className="text-lg font-semibold mb-2 text-white">{results.title}</h3>
              <p className="text-white text-sm mb-4">{results.description}</p>
              {results.famousCases && results.famousCases.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Famous cases:</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.famousCases.map((person, i) => (
                      <div key={i} className="flex flex-col items-center text-center w-20">
                        <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full"/>
                        <span className="text-white text-sm">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
