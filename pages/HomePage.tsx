import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getResources, deleteResource } from "../services/googleSheetService";
import { getSubjects } from "../services/subjectService";
import { Resource, Subject } from "../types";
import ResourceCard from "../components/ResourceCard";
import Spinner from "../components/Spinner";
import StudyPrayerDialog from "../components/StudyPrayerDialog";

const encouragingMessages = [
  "🚀 شد حيلك! النجاح بيفرق.",
  "📖 العلم نور… وانت النور الجاي.",
  "🔥 كل ساعة مذاكرة = خطوة لقدام.",
  "🎯 ركز دلوقتي ترتاح بكرة.",
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [heroMessage, setHeroMessage] = useState("");
  const [isPrayerOpen, setPrayerOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [resourcesData, subjectsData] = await Promise.all([
        getResources(),
        getSubjects(),
      ]);
      setResources(resourcesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setHeroMessage(encouragingMessages[randomIndex]);

    // لو لسه الدعاء ما ظهرش في الجلسة دي
    if (!sessionStorage.getItem("studyPrayerShown")) {
      setPrayerOpen(true);
      sessionStorage.setItem("studyPrayerShown", "true");
    }
  }, [fetchInitialData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((res) => res.id !== id));
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const filteredResources = useMemo(() => {
    return selectedSubject === "all"
      ? resources
      : resources.filter((res) => res.subjectId === selectedSubject);
  }, [resources, selectedSubject]);

  return (
    <div className="space-y-12 pb-12">
      {/* دعاء المذاكرة */}
      <StudyPrayerDialog
        isOpen={isPrayerOpen}
        onClose={() => setPrayerOpen(false)}
      />

      {/* Hero Section */}
      <section className="text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-12 px-4 rounded-lg shadow-md">
        <h1 className="text-4xl font-extrabold mb-4">📚 Study Hub</h1>
        <p className="text-lg font-medium">{heroMessage}</p>
      </section>

      {/* Subjects Filter */}
      <section className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={() => setSelectedSubject("all")}
          className={`px-4 py-2 rounded-full font-medium transition ${
            selectedSubject === "all"
              ? "bg-cyan-500 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          الكل
        </button>
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject.id)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedSubject === subject.id
                ? "bg-cyan-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {subject.name}
          </button>
        ))}
      </section>

      {/* Resources Grid */}
      <section className="px-4">
        {loading ? (
          <Spinner />
        ) : filteredResources.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            مفيش موارد متاحة دلوقتي.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onDelete={handleDelete}
                onClick={() => navigate(`/watch/${resource.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
