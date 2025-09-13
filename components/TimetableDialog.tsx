import React, { useEffect, useState } from "react";

type DayEvent = {
  type: "lecture" | "practical" | "exam" | "holiday";
  title: string;
  time?: string;
  location?: string;
};

type Timetable = Record<string, DayEvent[]>;

export default function TimetableDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [timetable, setTimetable] = useState<Timetable>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();

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
        .then((data: Timetable) => {
          setTimetable(data);
          
          const todayStr = today.toISOString().split("T")[0];
          if (data[todayStr] && data[todayStr].length > 0) {
            setSelectedDate(todayStr);
          } else {
            const dates = Object.keys(data).sort();
            const futureDate = dates.find((date) => date >= todayStr && data[date].length > 0);
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
          const mockData: Timetable = {
            "2025-09-13": [
              { type: "lecture", title: "Introduction to AI", time: "09:00", location: "Hall A" },
              { type: "practical", title: "Python Programming Lab", time: "11:30", location: "Lab 2B" },
            ],
            "2025-09-15": [
              { type: "exam", title: "Midterm Exam: Algorithms", time: "14:00", location: "Auditorium" },
            ],
            "2025-09-16": [
              { type: "holiday", title: "National Holiday" },
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

  const getEvents = (date: string): DayEvent[] => timetable[date] || [];

  const getEventStyle = (type: DayEvent["type"]) => {
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
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = getEvents(dateStr);
      const eventTypes = [...new Set(events.map(event => event.type))];

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
            relative p-3 rounded-lg text-lg font-medium transition-all duration-300 transform
            min-h-[60px] flex flex-col items-center justify-center border-2
            ${isToday ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500" : "border-transparent"}
            ${isSelected ? "bg-slate-700/70 border-slate-500 shadow-md" : "hover:bg-slate-700/40"}
            ${events.length > 0 ? "text-white" : "text-slate-300"}
            group
          `}
        >
          <span className={`text-xl font-extrabold transition-colors duration-300 ${isToday ? "text-blue-400" : ""}`}>{day}</span>
          {events.length > 0 && (
            <div className="flex justify-center mt-2 space-x-1">
              {eventTypes.map(type => (
                <div key={type} className={`w-2.5 h-2.5 rounded-full ${getEventStyle(type).dot}`} />
              ))}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden w-full shadow-lg">
        <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-4 border-b border-slate-600/50">
          <h2 className="text-xl font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-sm font-bold text-slate-400 p-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvents = selectedDate ? getEvents(selectedDate) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-slate-700 flex flex-col transform scale-95 md:scale-100 transition-transform duration-300">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center animate-slide-down">
          <h1 className="text-2xl font-extrabold text-white">Academic Timetable</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-300 p-1 rounded-full hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
            <span className="mt-4 text-lg text-slate-300 font-medium">Loading timetable...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Calendar Section */}
            <div className="flex-1 p-4 overflow-auto animate-slide-right">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else setCurrentMonth((m) => m - 1);
                  }}
                  className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl text-white font-extrabold">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else setCurrentMonth((m) => m + 1);
                  }}
                  className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                {renderCalendar(currentMonth, currentYear)}
              </div>
              
              {/* Event Legend */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 shadow-inner">
                <h3 className="text-base font-bold text-slate-300 mb-2">Event Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-slate-400">Lecture</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-slate-400">Practical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-slate-400">Exam</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-slate-400">Holiday</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="md:w-96 bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 p-5 flex-shrink-0 animate-slide-up">
              <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
              
              {selectedEvents.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                  <h3 className="text-base font-semibold text-slate-300">
                    {new Date(selectedDate!).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  {selectedEvents.map((event, index) => (
                    <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 transition-transform hover:scale-[1.02] duration-300 ease-in-out shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl transition-transform group-hover:rotate-12 duration-300">
                          {getEventStyle(event.type).icon}
                        </span>
                        <div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getEventStyle(event.type).dot.replace('bg-', 'bg-')}/50 text-white`}>
                            {getEventStyle(event.type).badge}
                          </span>
                          <h4 className="text-lg font-extrabold text-white mt-1 leading-tight">{event.title}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {event.time && (
                          <div className="flex items-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">{event.time}</span>
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-base font-medium">No events on this day</p>
                  <p className="mt-1 text-xs text-slate-500">Select another date from the calendar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
