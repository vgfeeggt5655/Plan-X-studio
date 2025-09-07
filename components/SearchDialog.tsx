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
  images: string[];
  famousCases?: { name: string; image: string }[];
}

// كلمات البحث الطبية بالإنجليزية
const medicalTerms = [
  "Heart",
  "Lungs",
  "Brain",
  "Liver",
  "Kidney",
  "Diabetes",
  "Hypertension",
  "Cancer",
  "Stroke",
  "Asthma",
  "Arthritis",
  "Migraine",
  // ... أضف باقي المصطلحات الطبية
];

const fuse = new Fuse(medicalTerms, { threshold: 0.3 });

// مفتاحك من Pixabay
const PIXABAY_API_KEY = "52176231-bd0707f83e7695350a4ae0672";

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedResult(null);
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // تحديث الاقتراحات أثناء الكتابة
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    const fuseResults = fuse.search(query, { limit: 5 });
    setSuggestions(fuseResults.map(r => r.item));
  }, [query]);

  // تحويل العربي لإنجليزي لو كتب المستخدم بالعربي
  const translateToEnglish = async (text: string) => {
    // لو عايز حل بدون API خارجي، ممكن تعمل خريطة عربي->إنجليزي
    // هنا نفترض النص بالفعل بالإنجليزية
    return text;
  };

  const handleSearch = async (term?: string) => {
    const searchTermRaw = term || query;
    if (!searchTermRaw) return;

    setLoading(true);
    try {
      // تصحيح الكلمة تلقائي باستخدام fuse.js
      const fuseResult = fuse.search(searchTermRaw);
      const finalTerm = fuseResult.length > 0 ? fuseResult[0].item : searchTermRaw;

      const searchTerm = await translateToEnglish(finalTerm);

      // جلب وصف المرض/الجزء من Wikipedia
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
      );
      const wikiData = await wikiRes.json();
      const description = wikiData.extract || "No description available.";

      // جلب الصور الطبية من Pixabay
      const pixabayRes = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchTerm + " medical")}+diagram&image_type=photo&per_page=50`
      );
      const pixabayData = await pixabayRes.json();
      const images: string[] = (pixabayData.hits || []).map((hit: any) => hit.largeImageURL);

      setResults([{
        title: wikiData.title,
        description,
        images,
        famousCases: [] // ممكن تضيف لاحقًا
      }]);
      setSelectedResult(null);
      setSuggestions([]);
      setQuery(finalTerm);
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
      <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/20">
        
        {/* Left: Images gallery */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search medical parts or diseases..."
              className="w-full p-3 rounded-md border border-white/30 bg-white/10 placeholder-white/70 text-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2 top-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Search
            </button>
            <button
              onClick={onClose}
              className="absolute right-16 top-2 p-1 text-white hover:text-red-400 transition"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="absolute top-12 left-0 w-full bg-white/30 backdrop-blur-md border border-white/20 rounded-md shadow-lg z-10 text-white">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSearch(s)}
                    className="px-3 py-2 hover:bg-primary/30 cursor-pointer"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loading && <div className="text-center text-white">Loading...</div>}
          {!loading && results.length === 0 && query && (
            <div className="text-center text-white">No results found.</div>
          )}

          {/* Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results[0]?.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={results[0].title}
                className="w-full h-40 object-cover rounded-md hover:scale-105 transition cursor-pointer"
                onClick={() => setSelectedResult(results[0])}
              />
            ))}
          </div>
        </div>

        {/* Right: Description */}
        <div className="hidden md:block w-1/3 bg-white/20 backdrop-blur-md p-4 border-l border-white/30 overflow-y-auto text-white">
          {selectedResult ? (
            <>
              <h3 className="text-xl font-semibold mb-2">{selectedResult.title}</h3>
              <p className="text-sm">{selectedResult.description}</p>
            </>
          ) : (
            <div>
              <h3 className="text-xl font-semibold mb-2">Quick Info</h3>
              <p className="text-sm">Select a medical part or disease on the left to see details here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
