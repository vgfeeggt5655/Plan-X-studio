import React, { useState, useEffect, useRef } from 'react';

const SearchDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setImages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setImages([]);

    try {
      // استخدم fetch بدل axios
      const response = await fetch(
        `https://openi.nlm.nih.gov/services/search?query=${encodeURIComponent(query)}&format=json`
      );
      const data = await response.json();
      const fetchedImages = data.result.map((item: any) => ({
        id: item.id,
        url: item.url,
        title: item.title,
      }));
      setImages(fetchedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 h-4/5 flex flex-col">
        <div className="bg-blue-600 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">بحث الصور الطبية</h2>
          <button onClick={onClose} className="p-1 text-white hover:text-blue-200">
            X
          </button>
        </div>

        <div className="p-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="ابحث عن أي صورة..."
            className="flex-1 p-2 rounded border border-blue-300"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-4 py-2 bg-white text-blue-600 font-bold rounded hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading && <div className="text-center text-gray-500">جارٍ تحميل الصور...</div>}
          {!loading && images.length === 0 && <div className="text-center text-gray-500">اكتب مصطلحًا واضغط بحث لرؤية الصور</div>}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {images.map((img) => (
              <img key={img.id} src={img.url} alt={img.title || 'صورة'} className="rounded shadow-sm w-full h-32 object-cover" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
