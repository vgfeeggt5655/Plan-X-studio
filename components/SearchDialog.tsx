import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';
import Fuse from 'fuse.js';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FamousCase {
  name: string;
  image?: string;
}

interface Result {
  title: string;
  description?: string;
  images?: string[];
  famousCases?: FamousCase[];
}

const medicalTerms = [
  { term: "Heart", type: "organ" },
  { term: "Liver", type: "organ" },
  { term: "Kidney", type: "organ" },
  { term: "Diabetes", type: "disease" },
  { term: "Hypertension", type: "disease" },
  { term: "Asthma", type: "disease" },
  { term: "Cancer", type: "disease" },
  // أضف باقي المصطلحات...
];

const fuse = new Fuse(medicalTerms, { keys: ['term'], threshold: 0.3 });

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
    setSuggestions(fuseResults.map(r => r.item.term));
  }, [query]);

  const fetchFamousCases = async (title: string): Promise<FamousCase[]> => {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections&format=json&origin=*`);
      const data = await res.json();
      const sections = data.parse.sections || [];
      const notableSection = sections.find((s: any) => /notable|famous/i.test(s.line));
      if (!notableSection) return [];

      // Fetch the content of the notable section
      const sectionRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=${notableSection.index}&format=json&origin=*`);
      const sectionData = await sectionRes.json();
      const html = sectionData.parse.text['*'] as string;

      // استخراج الأسماء من HTML (تقريبًا)
      const nameMatches = Array.from(html.matchAll(/title="([^"]+)"/g));
      const names = nameMatches.map(m => m[1]);
      return names.slice(0, 5).map(n => ({ name: n })); // نجيب أول ٥ فقط
    } catch {
      return [];
    }
  };

  const handleSearch = async (term?: string) => {
    const searchTerm = term || query;
    if (!searchTerm) return;

    setLoading(true);
    try {
      const fuseResult = fuse.search(searchTerm);
      const finalTermObj = fuseResult.length > 0 ? fuseResult[0].item : { term: searchTerm, type: 'disease' };
      const finalTerm = finalTermObj.term;

      if (finalTermObj.type === 'organ') {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(finalTerm)}`);
        const data = await res.json();
        const images = data.items?.filter((i: any) => i.type === 'image').slice(0, 5).map((i: any) => i.srcset?.[0]?.src || i.src || '') || [];
        setResults([{ title: finalTerm, images }]);
      } else {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(finalTerm)}`);
        const data = await res.json();
        const famousCases = await fetchFamousCases(finalTerm); // جلب Famous Cases تلقائي
        const image = data.thumbnail?.source ? [data.thumbnail.source] : [];
        setResults([{
          title: data.title,
          description: data.extract || 'No description available.',
          images: image,
          famousCases
        }]);
      }

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
      <div className="bg-white/20 backdrop-blur-lg rounded-xl shadow-lg w-11/12 md:w-4/5 lg:w-3/5 max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/30">
        
        {/* Left */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search medical terms or body parts..."
              className="w-full p-2 rounded-md border border-white/50 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button onClick={() => handleSearch()} className="absolute right-2 top-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition">Search</button>
            <button onClick={onClose} className="absolute right-16 top-2 p-1 text-white hover:text-red-500 transition"><XIcon className="h-5 w-5" /></button>

            {suggestions.length > 0 && (
              <ul className="absolute top-12 left-0 w-full bg-white/20 border border-white/30 rounded-md shadow-lg z-10 text-white backdrop-blur-sm">
                {suggestions.map((s, idx) => (
                  <li key={idx} onClick={() => handleSearch(s)} className="px-3 py-2 hover:bg-primary/20 cursor-pointer">{s}</li>
                ))}
              </ul>
            )}
          </div>

          {loading && <div className="text-center text-white">Loading...</div>}
          {!loading && results.length === 0 && query && <div className="text-center text-white">No results found.</div>}

          <div className="grid grid-cols-1 gap-4">
            {results.map((res, idx) => (
              <div key={idx} onClick={() => setSelectedResult(res)} className="flex flex-col md:flex-row gap-4 border border-white/30 rounded-md p-3 hover:shadow-md transition cursor-pointer">
                {res.images && res.images.map((img, i) => (
                  <img key={i} src={img} alt={res.title} className="w-full md:w-40 h-40 object-cover rounded-md" />
                ))}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className="text-lg font-semibold text-white">{res.title}</h3>
                  <p className="text-white/80 mt-1">{res.description}</p>
                  {res.famousCases && res.famousCases.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-medium text-white">Famous cases:</h4>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {res.famousCases.map((person, i) => (
                          <div key={i} className="flex flex-col items-center text-center">
                            {person.image && <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />}
                            <span className="text-sm text-white/80">{person.name}</span>
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

        {/* Right */}
        <div className="hidden md:block w-1/3 bg-white/10 backdrop-blur-lg p-4 border-l border-white/30 overflow-y-auto text-white">
          {selectedResult ? (
            <>
              <h3 className="text-lg font-semibold mb-2">{selectedResult.title}</h3>
              <p className="text-white/80 text-sm">{selectedResult.description}</p>
              {selectedResult.famousCases && selectedResult.famousCases.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-white">Famous cases:</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {selectedResult.famousCases.map((person, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        {person.image && <img src={person.image} alt={person.name} className="w-16 h-16 object-cover rounded-full" />}
                        <span className="text-sm text-white/80">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
              <p className="text-white/80 text-sm">Select a result on the left to see a brief description and any famous cases here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
