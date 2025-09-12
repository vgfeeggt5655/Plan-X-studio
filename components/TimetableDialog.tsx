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
  const [currentYear] = useState(2025);
  const today = new Date();

  // 🟢 تحميل JSON من public/data/timetable.json
  useEffect(() => {
    if (open) {
      fetch("/data/timetable.json")
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
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
            }
          }
        })
        .catch((err) => {
          console.error("Error loading timetable.json:", err);
        });
    }
  }, [open]);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(currentYear, i).toLocaleString("en-US", { month: "long" })
  );

  const getEvent = (date: string): DayEvent | null => {
    return timetable[date] || null;
  };

  const getEventStyle = (type: string) => {
    switch (type) {
      case "lecture":
        return {
          bg: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/50",
          text: "text-blue-300",
          accent: "border-l-4 border-blue-400",
          dot: "bg-blue-400",
          icon: "📚",
        };
      case "practical":
        return {
          bg: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/50",
          text: "text-purple-300",
          accent: "border-l-4 border-purple-400",
          dot: "bg-purple-400",
          icon: "🔬",
        };
      case "exam":
        return {
          bg: "bg-red-500/20 hover:bg-red-500/30 border-red-400/50",
          text: "text-red-300",
          accent: "border-l-4 border-red-400",
          dot: "bg-red-400",
          icon: "📝",
        };
      case "holiday":
        return {
          bg: "bg-green-500/20 hover:bg-green-500/30 border-green-400/50",
          text: "text-green-300",
          accent: "border-l-4 border-green-400",
          dot: "bg-green-400",
          icon: "🎉",
        };
      default:
        return {
          bg: "bg-slate-800 hover:bg-slate-700",
          text: "text-slate-300",
          accent: "",
          dot: "bg-slate-400",
          icon: "",
        };
    }
  };

  const renderCalendar = (monthIndex: number) => {
    const year = currentYear;
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
            min-h-[45px] flex flex-col items-center justify-center group
            ${style.bg} ${style.text} ${style.accent}
            ${isToday ? "ring-2 ring-cyan-400 scale-110 shadow-lg shadow-cyan-400/25" : ""} 
            ${selectedDate === dateStr ? "ring-2 ring-white/70 scale-105 shadow-xl" : ""}
            hover:scale-110 hover:shadow-lg transform border border-slate-600/30
          `}
        >
          <span className="relative z-10 font-bold">{day}</span>
          {event && (
            <>
              <div
                className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1 opacity-80 group-hover:opacity-100`}
              />
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 bg-slate-800 px-2 py-1 rounded text-white whitespace-nowrap z-20">
                {event.title}
              </span>
            </>
          )}
        </button>
      );
    }

    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4">
          <h2 className="text-2xl font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((dayName, idx) => (
              <div
                key={idx}
                className="text-center text-sm font-bold text-slate-400 py-2"
              >
                {dayName}
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
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-6 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">📅 Academic Timetable</h1>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-all duration-200 p-3 rounded-full hover:bg-slate-700/50 hover:scale-110"
            >
              ✖
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex h-[calc(95vh-100px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            {renderCalendar(currentMonth)}
          </div>

          {/* Event Details */}
          {selectedEvent && (
            <div className="w-80 bg-slate-800/50 border-l border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">📌 Event Details</h3>
              <div className="p-4 rounded-xl bg-slate-800/40">
                <p className="text-slate-300 mb-2">
                  {new Date(selectedDate!).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div>
                  <span className="text-2xl">{getEventStyle(selectedEvent.type).icon}</span>
                  <div className="text-white font-bold text-lg">
                    {selectedEvent.title}
                  </div>
                  {selectedEvent.time && (
                    <p className="text-slate-300">⏰ {selectedEvent.time}</p>
                  )}
                  {selectedEvent.location && (
                    <p className="text-slate-300">📍 {selectedEvent.location}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
