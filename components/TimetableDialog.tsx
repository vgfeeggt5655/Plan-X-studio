import React, { useEffect, useState } from "react";

type DayEvent = {
  type: "lecture" | "practical" | "exam" | "holiday";
  title: string;
  time?: string;
  location?: string;
};

export default function TimetableDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [timetable, setTimetable] = useState<Record<string, DayEvent>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();

  // Fetch timetable data from public/data/timetable.json
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      fetch("/data/timetable.json")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to load timetable data");
          }
          return res.json();
        })
        .then((data) => {
          setTimetable(data);
          
          // Set initial selected date to today if it has an event
          const todayStr = today.toISOString().split("T")[0];
          if (data[todayStr]) {
            setSelectedDate(todayStr);
          } else {
            // Find the next event if today has none
            const dates = Object.keys(data).sort();
            const futureDate = dates.find((date) => date >= todayStr);
            if (futureDate) {
              setSelectedDate(futureDate);
              const eventDate = new Date(futureDate);
              setCurrentMonth(eventDate.getMonth());
              setCurrentYear(eventDate.getFullYear());
            }
          }
        })
        .catch((err) => {
          console.error("Error loading timetable data:", err);
          // Fallback to some mock data if the fetch fails
          const mockData: Record<string, DayEvent> = {
            "2025-09-13": {
              type: "lecture",
              title: "Introduction to Biology",
              time: "09:00",
              location: "Hall A",
            },
          };
          setTimetable(mockData);
          setSelectedDate("2025-09-13");
          setCurrentMonth(8); // September
          setCurrentYear(2025);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getEvent = (date: string): DayEvent | null => timetable[date] || null;

  const getEventStyle = (type: string) => {
    switch (type) {
      case "lecture":
        return { dot: "bg-blue-500", icon: "📚", badge: "Lecture" };
      case "practical":
        return { dot: "bg-purple-500", icon: "🔬", badge: "Practical" };
      case "exam":
        return { dot: "bg-red-500", icon: "📝", badge: "Exam" };
      case "holiday":
        return { dot: "bg-green-500", icon: "🎉", badge: "Holiday" };
      default:
        return { dot: "bg-slate-400", icon: "", badge: "" };
    }
  };

  const renderCalendar = (monthIndex: number, year: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days: JSX.Element[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const event = getEvent(dateStr);
      const style = event ? getEventStyle(event.type) : null;

      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === monthIndex &&
        today.getDate() === day;

      const isSelected = selectedDate === dateStr;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`
            relative p-2 rounded-lg text-sm font-medium transition-all duration-200 
            min-h-[40px] flex flex-col items-center justify-center
            ${isToday ? "ring-2 ring-blue-500 bg-blue-500/10" : ""} 
            ${isSelected ? "bg-slate-700/70 ring-1 ring-slate-500" : "hover:bg-slate-700/40"}
            ${event ? "text-white" : "text-slate-300"}
          `}
        >
          <span className={`text-xs font-medium ${isToday ? "text-blue-400" : ""}`}>{day}</span>
          {event && (
            <div className={`w-2 h-2 rounded-full ${style?.dot} mt-1`} />
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden w-full">
        <div className="bg-slate-700/50 p-3 border-b border-slate-600/50">
          <h2 className="text-md font-semibold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-medium text-slate-400 p-1"
              >
                {d[0]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvent = selectedDate ? getEvent(selectedDate) : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Academic Timetable</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-1 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-300">Loading timetable...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Calendar Section */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else setCurrentMonth((m) => m - 1);
                  }}
                  className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white font-semibold">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else setCurrentMonth((m) => m + 1);
                  }}
                  className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                {renderCalendar(currentMonth, currentYear)}
              </div>
              
              {/* Event Legend */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Event Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-slate-400">Lecture</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs text-slate-400">Practical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-slate-400">Exam</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-slate-400">Holiday</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="md:w-96 bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
              
              {selectedEvent ? (
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">
                      {getEventStyle(selectedEvent.type).icon}
                    </span>
                    <div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-600/50 text-slate-300">
                        {getEventStyle(selectedEvent.type).badge}
                      </span>
                      <h3 className="text-lg font-semibold text-white mt-1">
                        {selectedEvent.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-300 text-sm">
                        {new Date(selectedDate!).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    
                    {selectedEvent.time && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-300 text-sm">{selectedEvent.time}</span>
                      </div>
                    )}
                    
                    {selectedEvent.location && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-slate-300 text-sm">{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Select a date to view event details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
