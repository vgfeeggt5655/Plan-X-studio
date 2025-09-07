import React, { useState } from 'react';

type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
};

type SearchResultPerson = { name: string; thumbnail?: string; pageUrl?: string };

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [people, setPeople] = useState<SearchResultPerson[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary(term: string) {
    const url = `https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('no summary');
    return (await res.json()) as WikiSummary;
  }

  async function fetchImagesFromWikimedia(term: string, limit = 8) {
    const api = `https://ar.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(
      term,
    )}&gsrlimit=${limit}&prop=pageimages&piprop=thumbnail&pithumbsize=600&origin=*`;
    const res = await fetch(api);
    if (!res.ok) throw new Error('no images');
    const j = await res.json();
    const pages = j.query?.pages || {};
    return Object.values(pages)
      .map((p: any) => p.thumbnail?.source)
      .filter(Boolean) as string[];
  }

  async function fetchNotablePerson(term: string) {
    const search = `${term} شخص مشهور|شخصية معروفة`;
    const api = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      search,
    )}&srlimit=6&format=json&origin=*`;
    const res = await fetch(api);
    if (!res.ok) return [];
    const j = await res.json();
    const hits = j.query?.search || [];
    const persons: SearchResultPerson[] = [];
    for (const h of hits) {
      try {
        const title = h.title;
        const sum = await fetchSummary(title);
        const thumb = sum.thumbnail?.source;
        persons.push({ name: title, thumbnail: thumb, pageUrl: sum.content_urls?.desktop?.page });
        if (persons.length >= 3) break;
      } catch {
        // تجاهل أي خطأ
      }
    }
    return persons;
  }

  async function doSearch() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    setImages([]);
    setPeople([]);
    try {
      const [s, imgs, ppl] = await Promise.all([
        fetchSummary(q),
        fetchImagesFromWikimedia(q),
        fetchNotablePerson(q),
      ]);
      setSummary(s);
      setImages(imgs);
      setPeople(ppl);
    } catch {
      setError('لم أجد معلومات كافية عن هذا المصطلح.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[85vh] overflow-auto">
        {/* شريط البحث */}
        <div className="p-4 border-b flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="اكتب اسم مرض أو عضو أو مكان..."
            className="flex-1 p-2 border rounded"
            autoFocus
          />
          <button onClick={doSearch} className="px-4 py-2 border rounded">بحث</button>
          <button onClick={onClose} className="px-3 py-2">إغلاق</button>
        </div>

        {/* النتائج */}
        <div className="p-4 grid grid-cols-3 gap-4">
          {/* صور */}
          <div className="col-span-2">
            {loading && <div>جارٍ البحث...</div>}
            {error && <div className="text-red-600">{error}</div>}
            <div className="grid grid-cols-2 gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt={`result-${i}`} className="w-full h-40 object-cover rounded" />
              ))}
            </div>
          </div>

          {/* شرح + أشخاص */}
          <div>
            <h3 className="font-semibold mb-2">الشرح</h3>
            {summary ? (
              <div>
                {summary.thumbnail && (
                  <img src={summary.thumbnail.source} className="w-full h-32 object-cover rounded mb-2" alt={summary.title} />
                )}
                <h4 className="font-bold">{summary.title}</h4>
                <p className="text-sm mt-2">{summary.extract}</p>
                {summary.content_urls?.desktop?.page && (
                  <a href={summary.content_urls.desktop.page} target="_blank" rel="noreferrer" className="text-blue-600 block mt-2">
                    قراءة المزيد على ويكيبيديا
                  </a>
                )}
              </div>
            ) : (
              <div>اضغط بحث لعرض ملخص.</div>
            )}

            <hr className="my-3" />
            <h4 className="font-semibold">أشخاص مشهورون مرتبطون</h4>
            {people.length === 0 && <div className="text-sm">لا توجد بيانات.</div>}
            <div className="mt-2 space-y-2">
              {people.map((p, i) => (
                <a key={i} href={p.pageUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <img src={p.thumbnail || '/images/logo.png'} alt={p.name} className="w-12 h-12 object-cover rounded" />
                  <div>
                    <div className="font-medium">{p.name}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
