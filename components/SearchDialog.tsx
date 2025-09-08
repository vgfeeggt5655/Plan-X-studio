import React, { useState, useRef } from 'react';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [arabPeople, setArabPeople] = useState<string[]>([]);
  const [foreignPeople, setForeignPeople] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const term = query.trim();
    setSearchTerm(term);
    setIframeKey(prev => prev + 1);
    await fetchFamousPeople(term);
  };

  const fetchFamousPeople = async (term: string) => {
    try {
      // نضيف كلمة مفتاحية "famous people" للبحث
      const searchQuery = `${term} famous people`;
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&pretty=1`
      );
      const data = await response.json();
      let allNames: string[] = [];

      if (data.RelatedTopics) {
        data.RelatedTopics.forEach((item: any) => {
          if (item.Text) allNames.push(item.Text.split('–')[0].trim());
          if (item.Topics) item.Topics.forEach((t: any) => {
            if (t.Text) allNames.push(t.Text.split('–')[0].trim());
          });
        });
      }

      // فلترة العرب مقابل الأجانب (أسماء عربية شائعة)
      const arab = allNames.filter(name => /محمد|أحمد|علي|محمود|يوسف|عائشة|خالد|فاطمة|سارة/.test(name));
      const foreign = allNames.filter(name => !/محمد|أحمد|علي|محمود|يوسف|عائشة|خالد|فاطمة|سارة/.test(name));

      // نحتفظ بأقصى 10 أسماء لكل فئة
      setArabPeople(arab.slice(0, 10));
      setForeignPeople(foreign.slice(0, 10));
    } catch (err) {
      console.error(err);
      setArabPeople([]);
      setForeignPeople([]);
    }
  };

  if (!open) return null;

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-11/12 md:w-4/5 h-4/5 flex overflow-hidden">

        {/* قسم البحث + صور */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-300">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="اكتب اسم المرض واضغط بحث..."
              className="flex-1 p-2 border border-gray-300 rounded mr-2"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              بحث
            </button>
            <button onClick={onClose} className="p-1 text-gray-700 hover:text-black ml-2">
              <XIcon className="h-6 w-6"/>
            </button>
          </div>

          <iframe
            key={iframeKey}
            src={bingImagesUrl}
            className="flex-1 w-full border-none"
            title="Bing Images Search"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        {/* قسم الأشخاص */}
        <div className="w-64 bg-gray-100 p-4 overflow-y-auto border-l border-gray-300">
          <h3 className="font-bold mb-2">أشهر الأشخاص المصابين</h3>

          {arabPeople.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">العرب</h4>
              <ul className="mb-4 list-disc list-inside">
                {arabPeople.map((name, i) => <li key={`arab-${i}`}>{name}</li>)}
              </ul>
            </>
          )}

          {foreignPeople.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">الأجانب</h4>
              <ul className="list-disc list-inside">
                {foreignPeople.map((name, i) => <li key={`foreign-${i}`}>{name}</li>)}
              </ul>
            </>
          )}

          {arabPeople.length === 0 && foreignPeople.length === 0 && (
            <p className="text-gray-500 text-sm">لا توجد معلومات متاحة.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchDialog;
