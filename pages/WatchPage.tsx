import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResources } from '../services/googleSheetService';
import { updateUser } from '../services/authService';
import { Resource } from '../types';
import Spinner from '../components/Spinner';

const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resource = useMemo(
    () => resources.find((r) => r.id === id),
    [resources, id]
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const forceDownload = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Download failed: ' + res.status);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Download Error:", err);
      alert("فشل التحميل. ممكن يكون السيرفر مش بيسمح بالتحميل المباشر.");
    }
  };

  if (loading) return <Spinner />;
  if (!resource) return <div>Resource not found</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{resource.title}</h1>
      {resource.type === 'video' && (
        <div>
          <video
            ref={videoRef}
            src={resource.url}
            controls
            className="w-full max-w-4xl rounded-lg shadow-md"
          />
          <button
            onClick={() => forceDownload(resource.url, `${resource.title}.mp4`)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            تحميل الفيديو
          </button>
        </div>
      )}

      {resource.type === 'pdf' && (
        <div>
          <iframe
            src={resource.url}
            className="w-full h-[600px] border rounded-lg"
            title={resource.title}
          />
          <button
            onClick={() => forceDownload(resource.url, `${resource.title}.pdf`)}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            تحميل PDF
          </button>
        </div>
      )}

      <Link
        to="/"
        className="inline-block mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        رجوع للرئيسية
      </Link>
    </div>
  );
};

export default WatchPage;
