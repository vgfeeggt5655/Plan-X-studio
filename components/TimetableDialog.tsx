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
  // timetable now supports multiple events per day
  const [timetable, setTimetable] = useState<Record<string, DayEvent[]>>({});
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
          if (!res.ok) throw new Error("Failed to load timetable data");
          return res.json();
        })
        .then((data) => {
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
        .catch(() => {
          const mockData: Record<string, DayEvent[]> = {
            "2025-09-13": [
              {
                type: "lecture",
                title: "Introduction to Biology",
                time: "09:00",
                location: "Hall A",
              },
              {
                type: "practical",
                title: "Lab Experiment",
                time: "11:00",
                location: "Lab 1",
              },
              {
                type: "exam",
                title: "Midterm Exam",
                time: "14:00",
                location: "Main Hall",
              },
            ],
          };
          setTimetable(mockData);
          setSelectedDate("2025-09-13");
          setCurrentMonth(8);
          setCurrentYear(2025);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const getEvents = (date: string): DayEvent[] => timetable[date] || [];

  const getEventStyle = (type: string) => {
    switch (type) {
      case "lecture": return { dot: "bg-blue-500", icon: "📚", badge: "Lecture" };
      case "practical": return { dot: "bg-purple-500", icon: "🔬", badge: "Practical" };
      case "exam": return { dot: "bg-red-500", icon: "📝", badge: "Exam" };
      case "holiday": return { dot: "bg-green-500", icon: "🎉", badge: "Holiday" };
      default: return { dot: "bg-slate-400", icon: "", badge: "" };
    }
  };

  const renderCalendar = (monthIndex: number, year: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days: JSX.Element[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-3" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const events = getEvents(dateStr);

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
            relative p-3 rounded-xl text-base font-bold transition-all duration-200 
            min-h-[60px] flex flex-col items-center justify-center
            ${isToday ? "ring-4 ring-blue-400 bg-blue-500/20" : ""} 
            ${isSelected ? "bg-slate-700/80 ring-2 ring-slate-500" : "hover:bg-slate-700/50"}
            ${events.length ? "text-white" : "text-slate-400"}
          `}
        >
          <span className={`text-lg ${isToday ? "text-blue-300" : ""}`}>{day}</span>
          <div className="flex gap-1 mt-1 flex-wrap justify-center">
            {events.map((ev, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${getEventStyle(ev.type).dot}`}
              />
            ))}
          </div>
        </button>
      );
    }

    return (
      <div className="bg-slate-800/70 rounded-2xl border border-slate-600 overflow-hidden w-full">
        <div className="bg-slate-700/70 p-4 border-b border-slate-600">
          <h2 className="text-xl font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayNames.map((d, idx) => (
              <div key={idx} className="text-center text-sm font-semibold text-slate-300">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvents = selectedDate ? getEvents(selectedDate) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-slate-700 flex flex-col text-lg">
        {/* Header */}
        <div className="bg-slate-800 p-5 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-white">📅 Academic Timetable</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-2 rounded-xl hover:bg-slate-700/50"
          >
            ✖
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            <span className="ml-4 text-slate-300 text-xl">Loading timetable...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Calendar Section */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else setCurrentMonth((m) => m - 1);
                  }}
                  className="text-slate-300 hover:text-white p-3 rounded-xl hover:bg-slate-700/50 text-xl"
                >
                  ◀
                </button>
                <span className="text-white font-bold text-2xl">
                  {months[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else setCurrentMonth((m) => m + 1);
                  }}
                  className="text-slate-300 hover:text-white p-3 rounded-xl hover:bg-slate-700/50 text-xl"
                >
                  ▶
                </button>
              </div>
              {renderCalendar(currentMonth, currentYear)}

              {/* Legend */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 mt-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Event Types</h3>
                <div className="grid grid-cols-2 gap-3 text-base">
                  <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div> Lecture</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div> Practical</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div> Exam</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div> Holiday</div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="md:w-[420px] bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 p-6 overflow-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>
              
              {selectedEvents.length > 0 ? (
                <div className="space-y-6">
                  {selectedEvents.map((event, idx) => (
                    <div key={idx} className="bg-slate-700/40 rounded-xl p-5 border border-slate-600">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl">{getEventStyle(event.type).icon}</span>
                        <div>
                          <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-600/70 text-slate-200">
                            {getEventStyle(event.type).badge}
                          </span>
                          <h3 className="text-xl font-bold text-white mt-2">{event.title}</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-base text-slate-300">
                        <div className="flex items-center">
                          📅 {new Date(selectedDate!).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        {event.time && <div className="flex items-center">⏰ {event.time}</div>}
                        {event.location && <div className="flex items-center">📍 {event.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-lg">
                  📅 Select a date to view event details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
