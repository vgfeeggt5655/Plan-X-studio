import React, { useEffect, useState } from "react";

// The DayEvent type has been updated to include new types and the 'instructors' property.
type DayEvent = {
  type: "lecture" | "practical" | "exam" | "holiday" | "tutorial" | "office_hour" | "cbl" | "lab" | "field_training";
  title: string;
  time?: string;
  location?: string;
  instructors?: string[];
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
  const [showEventDetails, setShowEventDetails] = useState(false);
  const today = new Date();

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);

      fetch("/data/timetable.json")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load timetable.json");
          return res.json();
        })
        .then((data: Timetable) => {
          setTimetable(data);

          const todayStr = today.toISOString().split("T")[0];
          if (data[todayStr] && data[todayStr].length > 0) {
            setSelectedDate(todayStr);
            setShowEventDetails(true);
          } else {
            const dates = Object.keys(data).sort();
            const futureDate = dates.find(
              (date) => date >= todayStr && data[date].length > 0
            );
            if (futureDate) {
              setSelectedDate(futureDate);
              const eventDate = new Date(futureDate);
              setCurrentMonth(eventDate.getMonth());
              setCurrentYear(eventDate.getFullYear());
              setShowEventDetails(true);
            } else {
              setSelectedDate(todayStr);
              setShowEventDetails(false);
            }
          }
        })
        .catch((err) => {
          console.error("Error loading timetable:", err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getEvents = (date: string): DayEvent[] => timetable[date] || [];

  // This function has been updated to handle the new event types.
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
      case "tutorial":
        return { dot: "bg-orange-500", icon: "✍️", badge: "Tutorial" };
      case "office_hour":
        return { dot: "bg-teal-500", icon: "👨‍🏫", badge: "Office Hour" };
      case "cbl":
        return { dot: "bg-cyan-500", icon: "🧠", badge: "CBL" };
      case "lab":
        return { dot: "bg-fuchsia-500", icon: "🧪", badge: "Lab" };
      case "field_training":
        return { dot: "bg-lime-500", icon: "🗺️", badge: "Field Training" };
      default:
        return { dot: "bg-slate-400", icon: "🗓️", badge: "" };
    }
  };

  const renderCalendar = (monthIndex: number, year: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days: JSX.Element[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const todayDate = today.toISOString().split("T")[0];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1 sm:p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = getEvents(dateStr);
      const eventTypes = [...new Set(events.map(event => event.type))];
      const hasExam = eventTypes.includes("exam");

      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === monthIndex &&
        today.getDate() === day;

      const isSelected = selectedDate === dateStr;
      const isPastDay = dateStr < todayDate && !isToday;

      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            if (events.length > 0) {
              setShowEventDetails(true);
            } else {
              setShowEventDetails(false);
            }
          }}
          className={`
            relative p-2 md:p-3 rounded-xl transform transition-all duration-300 ease-in-out
            flex flex-col items-center justify-start h-24 sm:h-28
            group overflow-hidden
            ${hasExam ? "bg-red-500/20 border-2 border-red-600 shadow-inner shadow-red-500/30" : "bg-slate-800/50"}
            ${isToday ? "ring-2 ring-blue-500" : ""}
            ${isSelected ? "bg-blue-700/60 ring-2 ring-blue-500 shadow-xl" : "hover:bg-slate-700/60"}
            ${isPastDay ? "opacity-50" : ""}
          `}
        >
          <span className={`
            text-2xl sm:text-3xl font-extrabold transition-all duration-300
            ${isToday ? "text-blue-400" : "text-slate-200 group-hover:text-white"}
          `}>
            {day}
          </span>
          {events.length > 0 && (
            <div className="absolute bottom-2 flex space-x-1">
              {eventTypes.slice(0, 4).map(type => (
                <div key={type} className={`w-2 h-2 rounded-full ${getEventStyle(type).dot}`} />
              ))}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden w-full shadow-lg">
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-xs sm:text-sm font-bold text-slate-400 p-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvents = selectedDate ? getEvents(selectedDate) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-4xl lg:max-w-6xl max-h-[95vh] overflow-hidden border border-slate-700 flex flex-col transform transition-transform duration-300">

        {/* Header */}
        <div className="bg-slate-800 p-3 sm:p-4 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Timetable</h1>
          <div className="flex items-center gap-2">
            {selectedEvents.length > 0 && (
              <button
                onClick={() => setShowEventDetails(!showEventDetails)}
                className="lg:hidden text-slate-400 hover:text-white transition-colors duration-300 p-1 rounded-full hover:bg-slate-700"
                title="Toggle event details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors duration-300 p-1 rounded-full hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-4 border-b-4 border-blue-500"></div>
            <span className="mt-4 text-sm sm:text-lg text-slate-300 font-medium">Loading timetable...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Event Details Section */}
            <div className={`
              bg-slate-800/80 border-t lg:border-t-0 lg:border-r border-slate-700 flex-shrink-0 transition-all duration-500 ease-in-out order-2 lg:order-1
              w-full lg:w-1/3 flex flex-col p-4 sm:p-6
              ${showEventDetails && selectedEvents.length > 0 ? '' : 'hidden lg:flex'}
            `}>
              {/* Mobile: Back button */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h2 className="text-lg sm:text-xl font-bold text-white">Event Details</h2>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-slate-400 hover:text-white transition-colors duration-300 p-1 rounded-full hover:bg-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {selectedDate && (
                <div className="text-center mb-6">
                  <p className="text-9xl sm:text-[10rem] font-extrabold leading-none text-white text-shadow-md">
                    {new Date(selectedDate).getDate()}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-400 -mt-2">
                    {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })}
                  </h2>
                  <p className="text-slate-400 font-light text-sm sm:text-base">
                    {new Date(selectedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {selectedEvents.length > 0 ? (
                <div className="space-y-3 overflow-y-auto pr-2">
                  {selectedEvents.map((event, index) => (
                    <div key={index} className="
                      bg-slate-700/50 rounded-lg p-3 border border-slate-600/50
                      transition-all duration-300 ease-in-out transform
                      hover:scale-[1.02] hover:bg-slate-700 hover:ring-2 hover:ring-blue-500/50 hover:shadow-lg
                      group
                    ">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl sm:text-4xl flex-shrink-0 transition-transform group-hover:scale-110">
                          {getEventStyle(event.type).icon}
                        </span>
                        <div>
                          <h4 className="text-lg font-bold text-white leading-tight">{event.title}</h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEventStyle(event.type).dot}/40 text-white`}>
                            {getEventStyle(event.type).badge}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        {event.time && (
                          <div className="flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-light">{event.time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-light">{event.location}</span>
                          </div>
                        )}
                        {event.instructors && event.instructors.length > 0 && (
                          <div className="flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292m0 5.292a4 4 0 110 5.292M12 4.354v5.292m0 5.292V4.354m0 5.292h-4.243m4.243 0h4.243m-4.243 0a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            <span className="font-light">{event.instructors.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-10 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm sm:text-base font-medium">No events on this day</p>
                  <p className="mt-1 text-xs text-slate-500">Select another date from the calendar</p>
                </div>
              )}
            </div>

            {/* Calendar Section */}
            <div className={`flex-1 p-2 sm:p-4 overflow-auto transition-all duration-300 order-1 lg:order-2 ${showEventDetails && selectedEvents.length > 0 ? 'hidden lg:flex' : 'flex'} lg:flex flex-col`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else setCurrentMonth((m) => m - 1);
                  }}
                  className="text-slate-300 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg sm:text-xl text-white font-extrabold">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else setCurrentMonth((m) => m + 1);
                  }}
                  className="text-slate-300 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {renderCalendar(currentMonth, currentYear)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
