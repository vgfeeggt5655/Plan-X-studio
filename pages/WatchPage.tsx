import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResources } from '../services/googleSheetService';
import { updateUser } from '../services/authService';
import { Resource } from '../types';
import Spinner from '../components/Spinner';
import PdfViewerModal from '../components/PdfViewerModal';
import MCQTestModal from '../components/MCQTestModal';
import FlashcardModal from '../components/FlashcardModal';
import { useAuth } from '../contexts/AuthContext';

// Simple SVG icons to replace imports
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 2v20l18-10L4 2z" />
  </svg>
);
const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 2h4v20H6V2zm8 0h4v20h-4V2z" />
  </svg>
);
const FullscreenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 4h6v2H6v4H4V4zm14 0h-6v2h4v4h2V4zm-14 14h6v-2H6v-4H4v6zm14 0h-6v-2h4v-4h2v6z" />
  </svg>
);

type WatchedProgress = { time: number; duration: number };
const parseWatchedData = (watched: string | undefined | null): Record<string, WatchedProgress> => {
    if (!watched) return {};
    try { return JSON.parse(watched); } catch { return {}; }
};

const getYoutubeVideoId = (url: string) => {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') return u.pathname.slice(1);
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    } catch {}
    return null;
};

const WatchPage: React.FC = () => {
    const { resourceId } = useParams<{ resourceId: string }>();
    const { user, updateCurrentUser } = useAuth();
    
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isPdfOpen, setPdfOpen] = useState(false);
    const [isTestOpen, setTestOpen] = useState(false);
    const [isFlashcardOpen, setFlashcardOpen] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ytPlayerRef = useRef<any>(null);

    const isYoutubeVideo = useMemo(() => resource ? resource.video_link.includes('youtube.com') || resource.video_link.includes('youtu.be') : false, [resource]);

    useEffect(() => {
        const fetchResourceData = async () => {
            if (!resourceId) { setError("Resource ID missing"); setLoading(false); return; }
            setLoading(true);
            try {
                const resourcesData = await getResources();
                setAllResources(resourcesData);
                const found = resourcesData.find(r => r.id === resourceId);
                setResource(found || null);
                if (!found) setError('Resource not found');
            } catch { setError('Failed to load resource data'); }
            finally { setLoading(false); }
        };
        fetchResourceData();
    }, [resourceId]);

    useEffect(() => {
        if (!resource) return;
        const video = videoRef.current;

        const restoreProgress = (time: number) => {
            if (video) video.currentTime = time;
        };

        const watched = parseWatchedData(user?.watched);
        if (watched[resourceId || ''] && !isYoutubeVideo) restoreProgress(watched[resourceId].time);

    }, [resource, user, resourceId, isYoutubeVideo]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current || !user) return;
        const time = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const watched = parseWatchedData(user.watched);
        watched[resourceId || ''] = { time, duration };
        const updatedUser = { ...user, watched: JSON.stringify(watched) };
        updateCurrentUser(updatedUser);
        updateUser(updatedUser).catch(console.error);
    };

    if (loading) return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Spinner text="Loading..." /></div>;
    if (error || !resource) return <div className="text-center text-red-500 mt-24">{error || 'Resource not found'}</div>;

    return (
      <>
        <div className="container mx-auto px-2 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                <main className="lg:col-span-2">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700">
                        {isYoutubeVideo ? (
                            <iframe
                                id="youtube-player"
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${getYoutubeVideoId(resource.video_link)}?autoplay=0&controls=1&rel=0&modestbranding=1`}
                                title={resource.title}
                                allowFullScreen
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                src={resource.video_link}
                                poster={resource.image_url}
                                className="w-full h-full"
                                onTimeUpdate={handleTimeUpdate}
                                onClick={togglePlay}
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                style={{ cursor: 'pointer' }}
                            />
                        )}
                        {!isYoutubeVideo && (
                            <div className="absolute bottom-4 left-4 flex items-center space-x-4">
                                <button onClick={togglePlay} className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition">
                                    {isPlaying ? <PauseIcon className="h-6 w-6 text-white" /> : <PlayIcon className="h-6 w-6 text-white" />}
                                </button>
                                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => { setVolume(+e.target.value); if (videoRef.current) videoRef.current.volume = +e.target.value; }} className="w-24"/>
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-white mt-4">{resource.title}</h1>
                    <p className="text-sm text-gray-400">{resource.Subject_Name}</p>

                    <div className="mt-4 flex gap-3">
                        <button onClick={() => setPdfOpen(true)} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 text-white">View PDF</button>
                        <button onClick={() => setFlashcardOpen(true)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-white">Flashcards</button>
                        <button onClick={() => setTestOpen(true)} className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600 text-white">Test Me</button>
                    </div>
                </main>
                {allResources.length > 1 && (
                    <aside className="lg:col-span-1 mt-8 lg:mt-0 overflow-y-auto max-h-[80vh]">
                        <h2 className="text-xl font-bold text-white mb-2">More from {resource.Subject_Name}</h2>
                        <div className="flex flex-col gap-3">
                            {allResources.filter(r => r.id !== resource.id && r.Subject_Name === resource.Subject_Name).map(res => (
                                <Link key={res.id} to={`/watch/${res.id}`} className="flex gap-3 bg-gray-800 p-2 rounded hover:bg-gray-700 transition">
                                    <img src={res.image_url} className="w-24 aspect-video rounded object-cover" />
                                    <div>
                                        <p className="text-sm text-gray-400">{res.Subject_Name}</p>
                                        <h3 className="text-base font-semibold text-white line-clamp-2">{res.title}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>

        <PdfViewerModal isOpen={isPdfOpen} onClose={() => setPdfOpen(false)} pdfUrl={resource.pdf_link} title={resource.title}/>
        <MCQTestModal isOpen={isTestOpen} onClose={() => setTestOpen(false)} resource={resource}/>
        <FlashcardModal isOpen={isFlashcardOpen} onClose={() => setFlashcardOpen(false)} resource={resource}/>
      </>
    );
};

export default WatchPage;
