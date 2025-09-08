import React from 'react';

// أيقونة X
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  query: string; // الكلمة اللي عايز تبحث عنها في Bing
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose, query }) => {
  if (!open) return null;

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-11/12 md:w-4/5 h-4/5 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white/20 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">بحث الصور من Bing</h2>
          <button onClick={onClose} className="p-1 text-white hover:text-blue-200">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>

        {/* Content */}
        <iframe
          src={bingImagesUrl}
          className="flex-1 w-full h-full border-none scale-105"
          title="Bing Images Search"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
};

export default SearchDialog;
