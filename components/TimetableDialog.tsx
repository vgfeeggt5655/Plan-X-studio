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
  const today = new Date();

  // 🟢 تحميل JSON من public/data/timetable.json
  useEffect(() => {
    if (open) {
      fetch("/data/timetable.json")
        .then((res) => res.json())
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
        .catch((err) => console.error("Error loading timetable.json:", err));
    }
  }, [open]);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2025, i).toLocaleString("en-US", { month: "long" })
  );

  const getEvent = (date: string): DayEvent | null => timetable[date] || null;

  const getEventStyle = (type: string) => {
    switch (type) {
      case "lecture":
        return { dot: "bg-blue-400", icon: "📚" };
      case "practical":
        return { dot: "bg-purple-400", icon: "🔬" };
      case "exam":
        return { dot: "bg-red-400", icon: "📝" };
      case "holiday":
        return { dot: "bg-green-400", icon: "🎉" };
      default:
        return { dot: "bg-slate-400", icon: "" };
    }
  };

  const renderCalendar = (monthIndex: number, year: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days: JSX.Element[] = [];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const event = getEvent(dateStr);
      const style = event ? getEventStyle(event.type) : getEventStyle("default");

      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === monthIndex &&
        today.getDate() === day;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`
            relative p-3 rounded-xl text-sm font-medium transition-all duration-300 
            min-h-[45px] flex flex-col items-center justify-center
            ${isToday ? "ring-2 ring-cyan-400 scale-110 shadow-lg shadow-cyan-400/25" : ""} 
            ${selectedDate === dateStr ? "ring-2 ring-white/70 scale-105 shadow-xl" : ""}
            hover:scale-110 hover:shadow-lg transform border border-slate-600/30
            ${event ? "bg-slate-800/70 text-white" : "bg-slate-700/40 text-slate-400"}
          `}
        >
          <span className="relative z-10 font-bold">{day}</span>
          {event && (
            <div
              className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1 opacity-90`}
            />
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden w-[340px] shrink-0">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-3">
          <h2 className="text-lg font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayNames.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-bold text-slate-400"
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

  const selectedEvent = selectedDate ? getEvent(selectedDate) : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden border border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-4 border-b border-slate-600/50 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">📅 Academic Timetable</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-slate-700/50 hover:scale-110"
          >
            ✖
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Calendar Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 border-b border-slate-700/50">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear((y) => y - 1);
                  } else setCurrentMonth((m) => m - 1);
                }}
                className="text-slate-300 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700/50"
              >
                ◀
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
                className="text-slate-300 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700/50"
              >
                ▶
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 p-4">
              {renderCalendar(currentMonth, currentYear)}
            </div>
          </div>

          {/* Event Details */}
          {selectedEvent && (
            <div className="w-96 bg-slate-800/70 border-l border-slate-700/50 p-6 flex flex-col justify-center">
              <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">
                    {getEventStyle(selectedEvent.type).icon}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {selectedEvent.title}
                  </h3>
                </div>
                <p className="text-slate-300 mb-2">
                  {new Date(selectedDate!).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {selectedEvent.time && (
                  <p className="text-slate-200 text-lg font-semibold mb-1">
                    ⏰ {selectedEvent.time}
                  </p>
                )}
                {selectedEvent.location && (
                  <p className="text-slate-200 text-lg font-semibold">
                    📍 {selectedEvent.location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
