import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Info {
  title: string;
  description: string;
  image: string;
}

const GOOGLE_API_KEY = 'AIzaSyA-D4x8MwvRumSY-lqBKlTfzoYlJMgUghY';
const CX = '335e910ac021b44bf';

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [startIndex, setStartIndex] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setInfo(null);
      setStartIndex(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const fetchImages = async (reset = false) => {
    if (!query) return;
    setLoading(true);
    try {
      const imgRes = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&searchType=image&q=${encodeURIComponent(
          query
        )}&num=20&start=${startIndex}&safe=high`
      );
      const imgData = await imgRes.json();
      const imgUrls = imgData.items?.map((item: any) => item.link) || [];

      setImages((prev) => (reset ? imgUrls : [...prev, ...imgUrls]));
      setStartIndex((prev) => prev + 20);

      if (reset) {
        // fetch wiki info once
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
        );
        const wikiData = await wikiRes.json();
        setInfo({
          title: wikiData.title,
          description: wikiData.extract,
          image: wikiData.thumbnail?.source || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setStartIndex(1);
    fetchImages(true); // reset images
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Infinite scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100 && !loading) {
        fetchImages();
      }
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [loading, startIndex, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl shadow-lg w-11/12 md:w-4/5 lg:w-4/5 max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Images */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative mb-4 col-span-full">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search for a disease or body part..."
              className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white/50 backdrop-blur-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Search
            </button>
            <button
              onClick={onClose}
              className="absolute right-16 top-2 p-1 text-gray-700 hover:text-red-500 transition"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {loading && <div className="col-span-full text-center text-gray-700">Loading...</div>}
          {!loading && images.length === 0 && query && (
            <div className="col-span-full text-center text-gray-700">No results found.</div>
          )}

          {images.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={query}
              className="w-full h-32 md:h-40 object-cover rounded-md hover:shadow-lg transition cursor-pointer"
            />
          ))}
        </div>

        {/* Right: Info panel */}
        <div className="hidden md:block w-1/3 bg-white/20 backdrop-blur-lg p-4 border-l border-gray-200 overflow-y-auto">
          {info ? (
            <>
              <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
              <p className="text-gray-700 text-sm">{info.description}</p>
              {info.image && (
                <img
                  src={info.image}
                  alt={info.title}
                  className="w-full h-40 object-cover rounded-md mt-2"
                />
              )}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
              <p className="text-gray-700 text-sm">
                Select a disease or body part on the left to see description and related info here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
