import React, { useEffect, useState } from "react";

// Updated type to handle multiple events per day
type TimetableEvent = {
  type: "lecture" | "practical" | "exam" | "holiday";
  title: string;
  time?: string;
  location?: string;
};

// Timetable data is now an array of events for each date
type DailyEvents = TimetableEvent[];

export default function TimetableDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [timetable, setTimetable] = useState<Record<string, DailyEvents>>({});
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
        .then((data: Record<string, DailyEvents>) => {
          setTimetable(data);

          const todayStr = today.toISOString().split("T")[0];
          if (data[todayStr]) {
            setSelectedDate(todayStr);
          } else {
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
          // Mock data now includes multiple events for a single day
          const mockData: Record<string, DailyEvents> = {
            "2025-09-13": [
              {
                type: "lecture",
                title: "Introduction to Biology",
                time: "09:00",
                location: "Hall A",
              },
              {
                type: "practical",
                title: "Chemistry Lab Session",
                time: "11:00",
                location: "Lab 3B",
              },
              {
                type: "exam",
                title: "Math Midterm",
                time: "14:00",
                location: "Main Auditorium",
              },
            ],
            "2025-09-15": [
              {
                type: "holiday",
                title: "National Holiday",
              },
            ],
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

  const getEvents = (date: string): DailyEvents | null => timetable[date] || null;

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
      days.push(<div key={`empty-${i}`} className="p-4" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const events = getEvents(dateStr);
      const eventTypes = events ? Array.from(new Set(events.map(e => e.type))) : [];

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
            relative p-2 rounded-xl text-lg font-medium transition-all duration-300 
            min-h-[70px] flex flex-col items-center justify-center
            ${isToday ? "ring-4 ring-blue-500 bg-blue-500/10" : ""} 
            ${isSelected ? "bg-slate-700/70 ring-2 ring-slate-500" : "hover:bg-slate-700/40"}
            ${events ? "text-white" : "text-slate-300"}
          `}
        >
          <span className={`text-xl font-bold ${isToday ? "text-blue-400" : ""}`}>{day}</span>
          {events && (
            <div className="flex gap-1 mt-2">
              {eventTypes.map((type, idx) => (
                <div key={idx} className={`w-3 h-3 rounded-full ${getEventStyle(type).dot}`} />
              ))}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 rounded-3xl border border-slate-700/50 overflow-hidden w-full">
        <div className="bg-slate-700/50 p-4 sm:p-6 border-b border-slate-600/50">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-sm sm:text-base font-bold text-slate-400 p-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvents = selectedDate ? getEvents(selectedDate) : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-8 animate-fade-in-down">
      <div className="bg-slate-900 rounded-3xl shadow-[0_0_40px_rgba(30,144,255,0.2)] max-w-6xl w-full max-h-[95vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b-2 border-slate-700 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Academic Timetable
          </h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-transform duration-200 transform hover:scale-125 p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 sm:p-20 flex-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <span className="mt-6 text-xl text-slate-300 font-medium">Loading timetable...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
            {/* Calendar Section */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else setCurrentMonth((m) => m - 1);
                  }}
                  className="text-slate-300 hover:text-white p-3 rounded-full hover:bg-slate-700/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white text-2xl font-bold tracking-wide">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else setCurrentMonth((m) => m + 1);
                  }}
                  className="text-slate-300 hover:text-white p-3 rounded-full hover:bg-slate-700/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="mb-8">
                {renderCalendar(currentMonth, currentYear)}
              </div>

              {/* Event Legend */}
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-bold text-slate-300 mb-4">Event Types</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm sm:text-base text-slate-400">Lecture</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm sm:text-base text-slate-400">Practical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm sm:text-base text-slate-400">Exam</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm sm:text-base text-slate-400">Holiday</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="lg:w-[450px] bg-slate-800 border-t-2 lg:border-t-0 lg:border-l-2 border-slate-700 p-6 sm:p-8 flex-shrink-0 overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                Event Details
              </h2>
              <p className="text-base text-slate-400 mb-6">
                <span className="font-bold">{new Date(selectedDate!).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
              </p>

              {selectedEvents && selectedEvents.length > 0 ? (
                <div className="space-y-6">
                  {selectedEvents.map((event, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50 transition-transform duration-300 hover:scale-[1.02] shadow-lg"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl text-white">
                          {getEventStyle(event.type).icon}
                        </span>
                        <div>
                          <span
                            className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full text-white"
                            style={{
                              backgroundColor: getEventStyle(event.type).dot.replace('bg-', 'var(--tw-ring-color, #'),
                              '--tw-ring-color': getEventStyle(event.type).dot.replace('bg-', ''),
                            }}
                          >
                            {getEventStyle(event.type).badge}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {event.time && (
                          <div className="flex items-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-base sm:text-lg">{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-base sm:text-lg">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">No events scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
