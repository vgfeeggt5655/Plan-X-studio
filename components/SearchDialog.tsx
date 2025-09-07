import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [famousPerson, setFamousPerson] = useState<{ name: string; image: string } | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setImages([]);
    setDescription('');
    setFamousPerson(null);

    try {
      // ✅ Fetch images (English search)
      const imgRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=4&client_id=YOUR_UNSPLASH_API_KEY`
      );
      const imgData = await imgRes.json();
      const imgUrls = imgData.results.map((r: any) => r.urls.small);
      setImages(imgUrls);

      // ✅ Fetch summary from Wikipedia (English)
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      );
      const wikiData = await wikiRes.json();
      if (wikiData.extract) {
        setDescription(wikiData.extract);
      }

      // ✅ Fetch famous person with same disease (using Wikipedia search)
      const famousRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query + ' notable people'
        )}&utf8=&format=json&origin=*`
      );
      const famousData = await famousRes.json();
      if (famousData?.query?.search?.length > 0) {
        const first = famousData.query.search[0].title;
        // fetch image for this person
        const personRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first)}`
        );
        const personData = await personRes.json();
        if (personData.thumbnail?.source) {
          setFamousPerson({ name: first, image: personData.thumbnail.source });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl shadow-lg w-full max-w-4xl p-6 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-secondary hover:text-red-500"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Search input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search for a disease, organ, or body part..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border-color bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="result"
                  className="rounded-lg w-full h-32 object-cover shadow"
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div>
            {description && (
              <p className="text-text-secondary leading-relaxed mb-4">{description}</p>
            )}

            {famousPerson && (
              <div className="flex items-center gap-3 mt-4 p-3 border border-border-color rounded-lg">
                <img
                  src={famousPerson.image}
                  alt={famousPerson.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <span className="text-text-primary font-medium">
                  Notable case: {famousPerson.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
