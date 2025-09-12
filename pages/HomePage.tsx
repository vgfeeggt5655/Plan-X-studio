import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources, deleteResource } from '../services/googleSheetService';
import { getSubjects } from '../services/subjectService';
import { Resource, Subject } from '../types';
import ResourceCard from '../components/ResourceCard';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import SubjectFilterDialog from '../components/SubjectFilterDialog';
import { useAuth } from '../contexts/AuthContext';
import { VideoIcon, SearchIcon, FilterIcon } from '../components/Icons';
import StudyPrayerDialog from '../components/StudyPrayerDialog'; // ✨ جديد

const encouragingMessages = [
  "Your next discovery is just a search away. What will you learn today?",
  "Unlock new knowledge. Find the perfect lecture to spark your curiosity.",
  "The journey of a thousand miles begins with a single click. Start learning now.",
  "Expand your horizons. Search for a topic and let the learning begin.",
  "Knowledge is power. Find your next lecture and empower yourself."
];

type WatchedProgress = { time: number; duration: number };

const parseWatchedData = (watched: string | undefined | null): Record<string, WatchedProgress> => {
  if (!watched || typeof watched !== 'string' || watched.trim() === '') return {};
  try {
    const data = JSON.parse(watched);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
    const normalizedData: Record<string, WatchedProgress> = {};
    for (const key in data) {
      if (typeof data[key] === 'number') {
        normalizedData[key] = { time: data[key], duration: 0 };
      } else if (typeof data[key] === 'object' && 'time' in data[key] && 'duration' in data[key]) {
        normalizedData[key] = data[key];
      }
    }
    return normalizedData;
  } catch (e) {
    console.error("Failed to parse watched data", e);
    return {};
  }
};

const HomePage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; resourceId: string | null }>({ isOpen: false, resourceId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [heroMessage, setHeroMessage] = useState('');
  const [isPrayerOpen, setPrayerOpen] = useState(false); // ✨ جديد
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resourcesData, subjectsData] = await Promise.all([
        getResources(),
        getSubjects()
      ]);
      setResources(resourcesData.reverse());
      const sortedSubjects = subjectsData.sort((a, b) => a.number - b.number);
      setSubjects(sortedSubjects);
    } catch (err) {
      setError('Failed to load content. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setHeroMessage(encouragingMessages[randomIndex]);

    // ✨ افتح الدعاء أول مرة في الجلسة
    const prayerShown = sessionStorage.getItem("studyPrayerShown");
    if (!prayerShown) {
      setPrayerOpen(true);
      sessionStorage.setItem("studyPrayerShown", "true");
    }
  }, [fetchInitialData]);

  const filteredResources = useMemo(() => {
    const searchWords = searchTerm.toLowerCase().split(' ').filter(w => w.length > 0);
    return resources
      .filter(r => {
        if (searchWords.length === 0) return true;
        const title = r.title.toLowerCase();
        const subject = r.Subject_Name.toLowerCase();
        return searchWords.every(word =>
          title.includes(word) || subject.includes(word)
        );
      })
      .filter(r =>
        selectedSubject ? r.Subject_Name === selectedSubject : true
      );
  }, [resources, searchTerm, selectedSubject]);

  const watchedData = useMemo(() => parseWatchedData(user?.watched), [user]);

  const continueWatchingResources = useMemo(() => {
    const watchedEntries = Object.entries(watchedData);
    if (watchedEntries.length === 0) return [];
    const resourceMap = new Map(resources.map(r => [r.id, r]));
    return watchedEntries
      .map(([id, progress]) => {
        const resource = resourceMap.get(id);
        if (!resource) return null;
        const percentage = progress.duration > 0 ? (progress.time / progress.duration) * 100 : 0;
        return { resource, progress: percentage };
      })
      .filter((item): item is { resource: Resource; progress: number } => item !== null)
      .sort((a, b) => (watchedData[b.resource.id]?.time || 0) - (watchedData[a.resource.id]?.time || 0));
  }, [resources, watchedData]);

  const groupedResources = useMemo(() => {
    return filteredResources.reduce((acc, resource) => {
      const subject = resource.Subject_Name || 'Uncategorized';
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(resource);
      return acc;
    }, {} as Record<string, Resource[]>);
  }, [filteredResources]);

  const orderedSubjects = useMemo(() => {
    const visibleSubjects = new Set(filteredResources.map(r => r.Subject_Name));
    return subjects.filter(s => visibleSubjects.has(s.Subject_Name));
  }, [filteredResources, subjects]);

  const handleDeleteRequest = (id: string) => {
    setDialogState({ isOpen: true, resourceId: id });
  };

  const handleConfirmDelete = async () => {
    if (!dialogState.resourceId) return;
    try {
      await deleteResource(dialogState.resourceId);
      setResources(prev => prev.filter(r => r.id !== dialogState.resourceId));
    } catch (err) {
      alert('Failed to delete resource. Please try again.');
      console.error(err);
    } finally {
      setDialogState({ isOpen: false, resourceId: null });
    }
  };

  const targetedResource = resources.find(r => r.id === dialogState.resourceId);

  if (loading) {
    return <div className="pt-24"><Spinner /></div>;
  }

  if (error) {
    return <div className="pt-24 text-center text-red-500 text-xl">{error}</div>;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      {/* ... باقي الكود بدون تغيير ... */}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, resourceId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
        message={
          <>
            Are you sure you want to delete this resource?
            <br />
            <strong>{targetedResource?.title}</strong>
            <br />
            This action cannot be undone.
          </>
        }
        confirmButtonText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />

      <SubjectFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSelectSubject={setSelectedSubject}
      />

      {/* ✨ Study Prayer Dialog */}
      <StudyPrayerDialog
        isOpen={isPrayerOpen}
        onClose={() => setPrayerOpen(false)}
      />
    </div>
  );
};

export default HomePage;
