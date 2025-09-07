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

// قائمة المصطلحات الطبية بالإنجليزي
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
  "Liver",
  "Lung",
  "Kidney",
  "Heart",
  "Brain",
  "Stomach",
  "Eye",
  "Skin",
  "Bone",
  // ... أضف باقي المصطلحات الطبية أو أعضاء الجسم
];

const fuse = new Fuse(medicalTerms, { threshold: 0.3 });

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

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    const fuseResults = fuse.search(query, { limit: 5 });
    setSuggestions(fuseResults.map(r => r.item));
  }, [query]);

  // دالة لتحويل العربي للإنجليزي
  const translateToEnglish = async (text: string) => {
    if (/[\u0600-\u06FF]/.test(text)) {
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`);
        const data = await res.json();
        return data.responseData.translatedText;
      } catch {
        return text;
      }
    }
    return text;
  };

  const handleSearch = async (term?: string) => {
    let searchTerm = term || query;
    if (!searchTerm) return;

    setLoading(true);
    try {
      // ترجمة عربي → إنجليزي
      searchTerm = await translateToEnglish(searchTerm);

      // تصحيح الكلمة تلقائي باستخدام fuse.js
      const fuseResult = fuse.search(searchTerm);
      const finalTerm = fuseResult.length > 0 ? fuseResult[0].item : searchTerm;

      // جلب بيانات من Wikipedia API
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(finalTerm)}`);
      const summaryData = await summaryRes.json();
      const description = summaryData.extract || 'No description available.';

      // جلب كل الصور المرتبطة بالموضوع
      const imagesRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(finalTerm)}&prop=images&format=json&origin=*`);
      const imagesData = await imagesRes.json();
      const pages = imagesData.query.pages;
      const images: string[] = [];
      Object.values(pages).forEach((page: any) => {
        if (page.images) {
          page.images.forEach((img: any) => {
            if (/\.(jpg|jpeg|png|gif)$/i.test(img.title)) {
              images.push(`https://en.wikipedia.org/wiki/Special:FilePath/${img.title.replace('File:', '')}`);
            }
          });
        }
      });

      setResults([{ title: summaryData.title, description, images, famousCases: [] }]);
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
      <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-lg w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

        {/* Left: Search and images */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search medical terms or body parts..."
              className="w-full p-2 rounded-md border border-border-color focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2 top-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Search
            </button>
            <button
              onClick={onClose}
              className="absolute right-16 top-2 p-1 text-text-secondary hover:text-red-500 transition"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {suggestions.length > 0 && (
              <ul className="absolute top-12 left-0 w-full bg-white/20 backdrop-blur-md border border-border-color rounded-md shadow-lg z-10">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSearch(s)}
                    className="px-3 py-2 hover:bg-primary/20 cursor-pointer"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loading && <div className="text-center text-text-secondary">Loading...</div>}
          {!loading && results.length === 0 && query && (
            <div className="text-center text-text-secondary">No results found.</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.length > 0 && results[0].images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={results[0].title}
                className="w-full h-40 object-cover rounded-md hover:scale-105 transition cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Right: Description + famous cases */}
        <div className="hidden md:block w-1/3 bg-white/20 backdrop-blur-md p-4 border-l border-border-color overflow-y-auto">
          {results.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-2">{results[0].title}</h3>
              <p className="text-text-secondary text-sm">{results[0].description}</p>
              {results[0].famousCases && results[0].famousCases.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-text-primary">Famous cases:</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {results[0].famousCases.map((person, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />
                        <span className="text-sm text-text-secondary">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {results.length === 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
              <p className="text-text-secondary text-sm">
                Select a term or body part to see description and images.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
