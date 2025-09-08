import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setIframeKey(prev => prev + 1);
  };

  const bingImagesUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchTerm)}&FORM=HDRSC2`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-11/12 md:w-5/6 lg:w-4/5 h-5/6 flex flex-col overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-blue-500">
              <h2 className="text-xl font-bold text-white">Image Search</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, opacity: 0.8 }}
                className="p-1 text-white"
              >
                <XIcon className="h-6 w-6"/>
              </motion.button>
            </div>

            {/* Search Bar */}
            <div className="flex p-4 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Type any keyword and press Enter..."
                className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <motion.button
                onClick={handleSearch}
                whileHover={{ scale: 1.05 }}
                className="ml-3 px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition"
              >
                Search
              </motion.button>
            </div>

            {/* Bing Images */}
            <div className="flex-1 overflow-hidden">
              {searchTerm ? (
                <iframe
                  key={iframeKey}
                  src={bingImagesUrl}
                  className="w-full h-full border-none"
                  title="Bing Images Search"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                  Enter a keyword to see images
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchDialog;
