import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";

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
  
  // 🟢 تحميل JSON من الملف
  useEffect(() => {
    if (open) {
      fetch("/data/timetable.json")
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          setTimetable(data);
          // البحث عن أول حدث اليوم أو قريب من اليوم
          const todayStr = today.toISOString().split('T')[0];
          if (data[todayStr]) {
            setSelectedDate(todayStr);
          } else {
            // البحث عن أقرب حدث
            const dates = Object.keys(data).sort();
            const futureDate = dates.find(date => date >= todayStr);
            if (futureDate) {
              setSelectedDate(futureDate);
              const eventDate = new Date(futureDate);
              setCurrentMonth(eventDate.getMonth());
            }
          }
        })
        .catch((err) => {
          console.error("Error loading timetable:", err);
          // استخدام بيانات تجريبية في حالة فشل التحميل
          const fallbackData = {
            "2025-09-15": { type: "lecture", title: "Introduction to Biology", time: "09:00", location: "Hall A" },
            "2025-09-16": { type: "practical", title: "Chemistry Lab", time: "14:00", location: "Lab 201" },
            "2025-09-20": { type: "exam", title: "Midterm Exam - Chemistry", time: "10:00", location: "Exam Hall" },
            "2025-09-25": { type: "holiday", title: "National Holiday" },
            "2025-10-05": { type: "lecture", title: "Advanced Mathematics", time: "10:30", location: "Room 305" },
          };
          setTimetable(fallbackData);
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
          icon: "📚"
        };
      case "practical":
        return {
          bg: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/50",
          text: "text-purple-300",
          accent: "border-l-4 border-purple-400",
          dot: "bg-purple-400",
          icon: "🔬"
        };
      case "exam":
        return {
          bg: "bg-red-500/20 hover:bg-red-500/30 border-red-400/50",
          text: "text-red-300",
          accent: "border-l-4 border-red-400",
          dot: "bg-red-400",
          icon: "📝"
        };
      case "holiday":
        return {
          bg: "bg-green-500/20 hover:bg-green-500/30 border-green-400/50",
          text: "text-green-300",
          accent: "border-l-4 border-green-400",
          dot: "bg-green-400",
          icon: "🎉"
        };
      default:
        return {
          bg: "bg-slate-800 hover:bg-slate-700",
          text: "text-slate-300",
          accent: "",
          dot: "bg-slate-400",
          icon: ""
        };
    }
  };

  const getTodaysEvents = () => {
    const todayStr = today.toISOString().split('T')[0];
    const todayEvent = timetable[todayStr];
    return todayEvent ? [{ date: todayStr, ...todayEvent }] : [];
  };

  const getUpcomingEvents = () => {
    const todayStr = today.toISOString().split('T')[0];
    return Object.entries(timetable)
      .filter(([date]) => date >= todayStr)
      .slice(0, 5)
      .map(([date, event]) => ({ date, ...event }));
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
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
              <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1 opacity-80 group-hover:opacity-100`} />
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
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4">
          <h2 className="text-2xl font-bold text-white text-center">
            {months[monthIndex]} {year}
          </h2>
        </div>
        
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((dayName, idx) => (
              <div key={idx} className="text-center text-sm font-bold text-slate-400 py-2">
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
  const todaysEvents = getTodaysEvents();
  const upcomingEvents = getUpcomingEvents();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-slate-700/50">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-6 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-2">
                📅 Academic Timetable
              </h1>
              <p className="text-slate-400">Your academic journey at a glance</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-all duration-200 p-3 rounded-full hover:bg-slate-700/50 hover:scale-110"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-slate-800/40 border-b border-slate-700/50">
          <div className="flex flex-wrap gap-6 text-sm justify-center">
            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/20">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-blue-300 font-medium">📚 Lectures</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-2 rounded-full border border-purple-500/20">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-purple-300 font-medium">🔬 Practical</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-2 rounded-full border border-red-500/20">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-red-300 font-medium">📝 Exams</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-full border border-green-500/20">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-green-300 font-medium">🎉 Holidays</span>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(95vh-200px)]">
          {/* Left Sidebar - Today's Events */}
          <div className="w-80 bg-slate-800/50 border-r border-slate-700/50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Today's Events */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Today's Schedule
                </h3>
                {todaysEvents.length > 0 ? (
                  <div className="space-y-3">
                    {todaysEvents.map((event, idx) => {
                      const style = getEventStyle(event.type);
                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${style.bg} ${style.accent} ${style.text} border-slate-600/30`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{style.icon}</span>
                            <span className="font-semibold text-sm uppercase tracking-wider opacity-80">
                              {event.type}
                            </span>
                          </div>
                          <h4 className="font-bold text-white mb-1">{event.title}</h4>
                          {event.time && (
                            <div className="flex items-center gap-2 text-sm opacity-80">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm opacity-80 mt-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    No events for today ✨
                  </p>
                )}
              </div>

              {/* Upcoming Events */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Upcoming Events</h3>
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 4).map((event, idx) => {
                    const style = getEventStyle(event.type);
                    const eventDate = new Date(event.date);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDate(event.date);
                          setCurrentMonth(eventDate.getMonth());
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all hover:scale-105 border border-slate-700/30 ${style.bg}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{style.icon}</span>
                          <span className={`text-xs ${style.text} opacity-80`}>
                            {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium truncate">{event.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="flex-1 flex flex-col">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-6 bg-slate-800/30 border-b border-slate-700/50">
              <button
                onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
                className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-white transition-all hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                {months[currentMonth]} {currentYear}
              </h2>
              
              <button
                onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
                className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-white transition-all hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderCalendar(currentMonth)}
            </div>
          </div>

          {/* Right Sidebar - Event Details */}
          {selectedEvent && (
            <div className="w-80 bg-slate-800/50 border-l border-slate-700/50 p-6">
              <div className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 rounded-2xl p-6 border border-slate-600/40">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Event Details
                </h3>
                
                <div className="space-y-4">
                  {/* Date */}
                  <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <span className="text-slate-300 text-sm">
                      {new Date(selectedDate!).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* Event Info */}
                  <div className="space-y-3">
                    {(() => {
                      const style = getEventStyle(selectedEvent.type);
                      return (
                        <div className={`p-4 rounded-xl border ${style.bg} ${style.accent} border-slate-600/30`}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{style.icon}</span>
                            <div>
                              <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${style.text}`}>
                                {selectedEvent.type}
                              </div>
                              <div className="text-white font-bold text-lg">
                                {selectedEvent.title}
                              </div>
                            </div>
                          </div>
                          
                          {selectedEvent.time && (
                            <div className="flex items-center gap-2 text-slate-300 mb-2">
                              <Clock className="w-4 h-4" />
                              <span>{selectedEvent.time}</span>
                            </div>
                          )}
                          
                          {selectedEvent.location && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4" />
                              <span>{selectedEvent.location}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
