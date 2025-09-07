import React, { useState } from "react";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    setSuggestion("");

    try {
      // 1- جرب تصحيح الكلمة لو غلط
      const suggestRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
          query
        )}&limit=1&namespace=0&format=json&origin=*`
      );
      const suggestData = await suggestRes.json();
      if (suggestData[1] && suggestData[1][0]) {
        setSuggestion(suggestData[1][0]);
      }

      // 2- هات ملخص + صورة
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          suggestion || query
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
      <div className="w-full max-w-5xl h-[80vh] rounded-2xl bg-white/20 shadow-xl backdrop-blur-xl border border-white/30 p-6 relative flex flex-col">
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
            placeholder="Search disease or body part (English only)..."
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

        {/* Suggestion if typo */}
        {suggestion && suggestion.toLowerCase() !== query.toLowerCase() && (
          <p className="text-yellow-300 mb-3">
            Did you mean:{" "}
            <button
              onClick={() => {
                setQuery(suggestion);
                handleSearch();
              }}
              className="underline hover:text-yellow-200"
            >
              {suggestion}
            </button>
            ?
          </p>
        )}

        {/* Results */}
        {loading && <p className="text-center text-white">Loading...</p>}
        {result && (
          <div className="flex-1 flex gap-6 overflow-y-auto">
            {/* Left: Image */}
            <div className="flex-1 flex items-start justify-center">
              {result.originalimage ? (
                <img
                  src={result.originalimage.source}
                  alt={result.title}
                  className="max-h-[400px] rounded-xl shadow-lg object-contain"
                />
              ) : (
                <p className="text-white">No medical image found.</p>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex-1 text-white space-y-3">
              <h2 className="text-3xl font-bold">{result.title}</h2>
              <p className="text-sm opacity-90">{result.extract}</p>
              {result.description && (
                <p className="text-xs opacity-70">
                  <strong>Category:</strong> {result.description}
                </p>
              )}

              {/* Placeholder famous people (لو عايز نكملها نجيب من links) */}
              {result.title.toLowerCase().includes("disease") && (
                <div className="mt-4">
                  <h3 className="font-semibold">Notable people affected:</h3>
                  <div className="flex gap-3 mt-2">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/89/Steve_Jobs_Headshot_2010-CROP.jpg"
                      alt="Steve Jobs"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold">Steve Jobs</p>
                      <p className="text-xs opacity-70">Pancreatic cancer</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDialog;
