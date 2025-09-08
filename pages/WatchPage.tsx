import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResources } from '../services/googleSheetService';
import { updateUser } from '../services/authService';
import { Resource } from '../types';
import Spinner from '../components/Spinner';
import { DocumentIcon, BrainIcon, CloudDownloadIcon, CollectionIcon, SpeedIcon, ChevronDownIcon, CheckIcon, PlayIcon, PauseIcon, FullscreenIcon } from '../components/Icons';
import PdfViewerModal from '../components/PdfViewerModal';
import MCQTestModal from '../components/MCQTestModal';
import FlashcardModal from '../components/FlashcardModal';
import { useAuth } from '../contexts/AuthContext';

type WatchedProgress = { time: number; duration: number };

const parseWatchedData = (watched: string | undefined | null): Record<string, WatchedProgress> => {
    if (!watched || typeof watched !== 'string' || watched.trim() === '') return {};
    try {
        const data = JSON.parse(watched);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
        const normalizedData: Record<string, WatchedProgress> = {};
        for (const key in data) {
            if (typeof data[key] === 'number') normalizedData[key] = { time: data[key], duration: 0 };
            else if (typeof data[key] === 'object' && 'time' in data[key] && 'duration' in data[key]) normalizedData[key] = data[key];
        }
        return normalizedData;
    } catch (e) { console.error("Failed to parse watched data", e); return {}; }
};

const getYoutubeVideoId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
        else if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
    } catch (e) { console.error("Invalid YouTube URL", e); }
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
    const [isPdfDownloading, setIsPdfDownloading] = useState(false);
    const [isVideoDownloading, setIsVideoDownloading] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
    const [hoverControls, setHoverControls] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const watchedDataRef = useRef<Record<string, WatchedProgress>>({});
    const saveProgressTimeoutRef = useRef<number | null>(null);

    const isYoutubeVideo = useMemo(() => resource ? resource.video_link.includes('youtube.com') || resource.video_link.includes('youtu.be') : false, [resource]);

    useEffect(() => {
        if (!resourceId) { setError("Resource ID is missing."); setLoading(false); return; }
        setLoading(true);
        getResources().then(resources => {
            setAllResources(resources);
            const foundResource = resources.find(r => r.id === resourceId);
            setResource(foundResource || null);
            if (!foundResource) setError('Resource not found.');
        }).catch(() => setError('Failed to load resource data.')).finally(() => setLoading(false));
    }, [resourceId]);

    // Custom HTML5 player setup for direct video links
    useEffect(() => {
        if (!resource || isYoutubeVideo) return;
        const video = videoRef.current;
        if (!video) return;

        const restoreProgress = () => {
            if (!user || !resourceId) return;
            const saved = parseWatchedData(user.watched)[resourceId];
            if (saved?.time) video.currentTime = saved.time;
        };

        restoreProgress();

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => currentTimeRef.current = video.currentTime;

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('timeupdate', onTimeUpdate);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('timeupdate', onTimeUpdate);
        };
    }, [resource, user, resourceId, isYoutubeVideo]);

    useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = playbackRate; }, [playbackRate]);

    // Progress save
    const saveProgress = useCallback(() => {
        if (!user || !resourceId) return;
        const time = currentTimeRef.current;
        const duration = durationRef.current || (videoRef.current?.duration || 0);
        if (time <= 0 || duration <= 0) return;

        const isComplete = time / duration > 0.95;
        if (isComplete && watchedDataRef.current[resourceId]) delete watchedDataRef.current[resourceId];
        else watchedDataRef.current[resourceId] = { time, duration };

        const newWatched = JSON.stringify(watchedDataRef.current);
        if (user.watched === newWatched) return;

        const updatedUser = { ...user, watched: newWatched };
        updateCurrentUser(updatedUser);
        updateUser(updatedUser).catch(console.error);
    }, [user, resourceId, updateCurrentUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying) saveProgressTimeoutRef.current = window.setTimeout(saveProgress, 5000);
        }, 1000);
        window.addEventListener('beforeunload', saveProgress);
        return () => { clearInterval(interval); window.removeEventListener('beforeunload', saveProgress); saveProgress(); };
    }, [isPlaying, saveProgress]);

    if (loading) return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Spinner text="Loading course..." /></div>;
    if (error || !resource) return <div className="pt-24 container mx-auto px-4 text-center text-red-500 text-xl">{error || 'Could not load the resource.'}</div>;

    const togglePlay = () => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); } };

    return (
        <>
        <div className="container mx-auto px-2 sm:px-4 py-8 pt-20 sm:pt-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 xl:gap-12">
                <main className="lg:col-span-2 animate-fade-in-up">
                    <div 
                        className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-primary/20 border border-border-color group" 
                        ref={containerRef}
                        onMouseEnter={() => setHoverControls(true)}
                        onMouseLeave={() => setHoverControls(false)}
                    >
                        {isYoutubeVideo ? (
                            <div id="youtube-player-container" className="w-full h-full" />
                        ) : (
                            <>
                            <video ref={videoRef} src={resource.video_link} poster={resource.image_url} className="w-full h-full object-cover" />
                            {/* Custom controls */}
                            <div className={`absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 flex items-center justify-between transition-opacity ${hoverControls ? 'opacity-100' : 'opacity-0'}`}>
                                <button onClick={togglePlay} className="text-white">
                                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                                </button>
                                <input 
                                    type="range"
                                    min={0}
                                    max={videoRef.current?.duration || 0}
                                    step={0.1}
                                    value={videoRef.current?.currentTime || 0}
                                    onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
                                    className="w-full mx-4"
                                />
                                <button onClick={() => { if (videoRef.current) videoRef.current.requestFullscreen(); }} className="text-white">
                                    <FullscreenIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        </>
                        )}
                    </div>
                </main>
                {/* Related resources */}
                {allResources.length > 0 && (
                    <aside className="lg:col-span-1 mt-12 lg:mt-0 animate-fade-in-up" style={{animationDelay:'0.2s'}}>
                        <h2 className="text-2xl font-bold text-text-primary mb-4 px-2">More from {resource.Subject_Name}</h2>
                        <div className="flex flex-col gap-4 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin pr-2">
                             {allResources.filter(r => r.Subject_Name === resource.Subject_Name && r.id !== resource.id).map(res => (
                               <Link to={`/watch/${res.id}`} key={res.id} className="flex gap-4 bg-surface p-3 rounded-lg hover:bg-slate-700 transition-colors border border-transparent hover:border-border-color">
                                    <img src={res.image_url} alt={res.title} className="w-32 aspect-video rounded object-cover flex-shrink-0" />
                                    <div className="flex flex-col justify-center">
                                        <p className="text-xs font-bold text-secondary uppercase tracking-wide">{res.Subject_Name}</p>
                                        <h3 className="text-sm font-bold text-text-primary leading-tight line-clamp-2">{res.title}</h3>
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
        <style>{`
            #youtube-player-container,
            #youtube-player-container iframe {
              width: 100%;
              height: 100%;
            }
        `}</style>
        </>
    );
};

export default WatchPage;
