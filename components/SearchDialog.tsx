import React, { useState } from "react";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white/20 shadow-xl backdrop-blur-xl border border-white/30 p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 px-3 py-1 rounded-md text-white bg-red-500/70 hover:bg-red-500"
        >
          ✕
        </button>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search for a disease or body part..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md border focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Results */}
        {loading && <p className="text-center text-white">Loading...</p>}
        {result && (
          <div className="flex flex-col md:flex-row gap-4">
            {result.thumbnail && (
              <img
                src={result.thumbnail.source}
                alt={result.title}
                className="w-48 h-48 object-cover rounded-xl shadow-md"
              />
            )}
            <div className="flex-1 text-white space-y-2">
              <h2 className="text-2xl font-bold">{result.title}</h2>
              <p className="text-sm opacity-90">{result.extract}</p>
              {result.description && (
                <p className="text-xs opacity-70">
                  <strong>Category:</strong> {result.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDialog;
