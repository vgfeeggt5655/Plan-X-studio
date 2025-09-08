import React, { useEffect, useState } from 'react';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  query: string; // اسم المرض
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose, query }) => {
  const [arabPeople, setArabPeople] = useState<string[]>([]);
  const [foreignPeople, setForeignPeople] = useState<string[]>([]);
  
  useEffect(() => {
    if (!query) return;

    const fetchPeople = async () => {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=links&titles=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        const pages = data.query.pages;
        const page = pages[Object.keys(pages)[0]];
        const links: string[] = page.links ? page.links.map((l: any) => l.title) : [];

        // فلترة العرب والأجانب (مثال مبسط)
        const arab = links.filter(name => /محمد|أحمد|علي|محمود/.test(name));
        const foreign = links.filter(name => !/محمد|أحمد|علي|محمود/.test(name));

        setArabPeople(arab);
        setForeignPeople(foreign);

      } catch (err) {
        console.error(err);
        setArabPeople([]);
        setForeignPeople([]);
      }
    };

    fetchPeople();
  }, [query]);

  if (!open) return null;

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-11/12 md:w-4/5 h-4/5 flex overflow-hidden">
        
        {/* محتوى الصور */}
        <div className="flex-1 relative">
          <div className="flex justify-end p-2">
            <button onClick={onClose} className="p-1 text-gray-700 hover:text-black">
              ✖
            </button>
          </div>
          <iframe
            src={bingImagesUrl}
            className="w-full h-full border-none"
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
