import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

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
    setResult(null);

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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* خلفية سوداء شفافة */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="relative w-full max-w-2xl rounded-2xl 
          bg-white/10 backdrop-blur-xl border border-white/20 
          shadow-2xl text-white p-6 space-y-4"
        >
          {/* زرار إغلاق */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <X size={20} />
          </button>

          <Dialog.Title className="text-2xl font-bold mb-2">
            🔍 بحث طبي
          </Dialog.Title>

          {/* input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اكتب اسم المرض أو العضو (بالإنجليزي)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2 bg-white/20 border border-white/30 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold"
            >
              {loading ? "جارٍ البحث..." : "بحث"}
            </button>
          </div>

          {/* النتيجة */}
          {result && (
            <div className="mt-4 space-y-3 text-left">
              <h2 className="text-xl font-semibold">{result.title}</h2>

              {result.thumbnail?.source && (
                <img
                  src={result.thumbnail.source}
                  alt={result.title}
                  className="w-60 rounded-lg shadow-lg"
                />
              )}

              <p className="text-sm text-gray-200 leading-relaxed">
                {result.extract}
              </p>

              {result.content_urls?.desktop?.page && (
                <a
                  href={result.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-blue-300 hover:text-blue-400 underline"
                >
                  اقرأ المزيد على ويكيبيديا
                </a>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SearchDialog;
