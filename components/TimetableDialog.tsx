import React, { useEffect, useState, useRef } from "react";

type DayEvent = {
  type: "lecture" | "exam" | "holiday";
  title: string;
  time?: string;
};

export default function TimetableDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [timetable, setTimetable] = useState<Record<string, DayEvent>>({
    "2025-09-15": { type: "lecture", title: "Introduction to Biology", time: "09:00" },
    "2025-09-20": { type: "exam", title: "Midterm Exam - Chemistry", time: "14:00" },
    "2025-09-25": { type: "holiday", title: "National Holiday" },
    "2025-10-05": { type: "lecture", title: "Advanced Mathematics", time: "10:30" },
    "2025-10-12": { type: "exam", title: "Final Exam - Physics", time: "13:00" },
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = new Date();
  const currentMonth = today.getMonth();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      const currentMonthEl = scrollRef.current.querySelector(
        `[data-month="${currentMonth}"]`
      );
      if (currentMonthEl) {
        currentMonthEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [open, currentMonth]);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2025, i).toLocaleString("en-US", { month: "long" })
  );

  const getEvent = (date: string): DayEvent | null => {
    return timetable[date] || null;
  };

  const renderCalendar = (monthIndex: number) => {
    const year = 2025;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();

    const days: JSX.Element[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-3" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const event = getEvent(dateStr);

      let bgColor = "bg-slate-800 hover:bg-slate-700";
      let textColor = "text-slate-300";
      let eventIndicator = "";

      if (event?.type === "lecture") {
        bgColor = "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/30";
        textColor = "text-cyan-300";
        eventIndicator = "border-l-4 border-cyan-400";
      }
      if (event?.type === "exam") {
        bgColor = "bg-red-500/20 hover:bg-red-500/30 border-red-400/30";
        textColor = "text-red-300";
        eventIndicator = "border-l-4 border-red-400";
      }
      if (event?.type === "holiday") {
        bgColor = "bg-green-500/20 hover:bg-green-500/30 border-green-400/30";
        textColor = "text-green-300";
        eventIndicator = "border-l-4 border-green-400";
      }

      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === monthIndex &&
        today.getDate() === day;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`
            relative p-3 rounded-lg border border-slate-700/50 text-sm font-medium 
            transition-all duration-200 min-h-[50px] flex items-center justify-center
            ${bgColor} ${textColor} ${eventIndicator}
            ${isToday ? "ring-2 ring-cyan-400 bg-cyan-500/30 text-cyan-200 font-bold" : ""} 
            ${selectedDate === dateStr ? "ring-2 ring-white/50 scale-105" : ""}
            hover:scale-105 hover:shadow-lg transform
          `}
        >
          <span className="relative z-10">{day}</span>
          {event && (
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-current opacity-60" />
          )}
        </button>
      );
    }

    return (
      <div
        key={monthIndex}
        data-month={monthIndex}
        className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4">
          <h2 className="text-xl font-bold text-white">
            {months[monthIndex]} 2025
          </h2>
        </div>
        
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((dayName) => (
              <div key={dayName} className="text-center text-xs font-semibold text-slate-400 py-2">
                {dayName}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>
      </div>
    );
  };

  const selectedEvent = selectedDate ? getEvent(selectedDate) : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                📅 Academic Timetable
              </h1>
              <p className="text-slate-400">Plan your academic journey</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-700/50">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500/30 border border-cyan-400/50 rounded"></div>
              <span className="text-cyan-300">Lectures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/30 border border-red-400/50 rounded"></div>
              <span className="text-red-300">Exams</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/30 border border-green-400/50 rounded"></div>
              <span className="text-green-300">Holidays</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Calendar */}
          <div className="flex-1">
            <div
              ref={scrollRef}
              className="h-[60vh] overflow-y-auto p-6 bg-slate-900/50"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 #1e293b'
              }}
            >
              {months.map((_, i) => renderCalendar(i))}
            </div>
          </div>

          {/* Event Details Sidebar */}
          {selectedEvent && (
            <div className="w-80 bg-slate-800/70 border-l border-slate-700/50 p-6">
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30">
                <h3 className="text-lg font-bold text-white mb-4">
                  Event Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="text-slate-300 text-sm">
                      {new Date(selectedDate!).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      selectedEvent.type === 'lecture' ? 'bg-cyan-400' :
                      selectedEvent.type === 'exam' ? 'bg-red-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                        selectedEvent.type === 'lecture' ? 'text-cyan-400' :
                        selectedEvent.type === 'exam' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {selectedEvent.type}
                      </div>
                      <div className="text-white font-medium">
                        {selectedEvent.title}
                      </div>
                      {selectedEvent.time && (
                        <div className="text-slate-400 text-sm mt-1">
                          📍 {selectedEvent.time}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
