import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources, deleteResource } from '../services/googleSheetService';
import { getSubjects } from '../services/subjectService';
import { Resource, Subject } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ResourceCard from '../components/ResourceCard';
import Spinner from '../components/Spinner';
import SubjectFilterDialog from '../components/SubjectFilterDialog';
import TodoDialog from '../components/TodoDialog';
import { FilterIcon } from '../components/Icons';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isTodoOpen, setTodoOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, subjData] = await Promise.all([
          getResources(),
          getSubjects(),
        ]);
        setResources(resData);
        setSubjects(subjData);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredResources = selectedSubject
    ? resources.filter((r) => r.Subject_Name === selectedSubject)
    : resources;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center shadow-md bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Plan X
        </h1>
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md"
          >
            <FilterIcon className="h-5 w-5" />
            <span className="hidden md:inline">Filter</span>
            {selectedSubject && (
              <span className="ml-2 text-xs bg-white text-blue-600 px-2 py-0.5 rounded-full">
                {selectedSubject}
              </span>
            )}
          </button>

          {/* Todo Button */}
          <button
            onClick={() => setTodoOpen(true)}
            className="ml-2 inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
          >
            📋 Tasks
            <span className="hidden md:inline">Today</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="p-4">
        {loading ? (
          <Spinner />
        ) : filteredResources.length === 0 ? (
          <p className="text-center text-gray-500">
            No resources found. Try another subject.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <SubjectFilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        subjects={subjects}
        onSelect={(subj) => setSelectedSubject(subj)}
      />

      <TodoDialog isOpen={isTodoOpen} onClose={() => setTodoOpen(false)} />
    </div>
  );
};

export default HomePage;
