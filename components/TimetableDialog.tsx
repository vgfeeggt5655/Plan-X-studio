import React, { useEffect, useState, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";

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
  const [timetable, setTimetable] = useState<Record<string, DayEvent>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = new Date();
  const currentMonth = today.getMonth(); // الشهر الحالي
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 🟢 تحميل JSON
  useEffect(() => {
    fetch("/data/timetable.json")
      .then((res) => res.json())
      .then((data) => setTimetable(data))
      .catch((err) => console.error("Error loading timetable:", err));
  }, []);

  // 🟢 بعد الفتح: يروح للشهر الحالي
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

    // فراغات قبل أول يوم
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const event = getEvent(dateStr);

      // 🟢 لون حسب النوع
      let bgColor = "bg-white";
      if (event?.type === "lecture") bgColor = "bg-blue-100";
      if (event?.type === "exam") bgColor = "bg-red-200";
      if (event?.type === "holiday") bgColor = "bg-green-200";

      // 🟢 تمييز اليوم الحالي
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === monthIndex &&
        today.getDate() === day;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`p-2 rounded-lg border text-sm font-medium transition-all 
            ${bgColor} 
            ${isToday ? "ring-2 ring-indigo-500 font-bold" : ""} 
            hover:scale-105`}
        >
          {day}
        </button>
      );
    }

    return (
      <div
        key={monthIndex}
        data-month={monthIndex}
        className="mb-10 p-4 rounded-xl bg-gray-50 shadow"
      >
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">
          {months[monthIndex]}
        </h2>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  const selectedEvent = selectedDate ? getEvent(selectedDate) : null;

  return (
    <Dialog open={open} onClose={onClose}>
      <h1 className="text-2xl font-bold mb-4 text-center text-indigo-600">
        📅 Academic Timetable
      </h1>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="h-[65vh] overflow-y-auto pr-2 space-y-6"
      >
        {months.map((_, i) => renderCalendar(i))}
      </div>

      {/* تفاصيل اليوم */}
      {selectedEvent && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl shadow">
          <h2 className="font-bold text-indigo-700">
            Details for {selectedDate}
          </h2>
          <p>
            <span className="font-semibold">
              {selectedEvent.type.toUpperCase()}:
            </span>{" "}
            {selectedEvent.title}{" "}
            {selectedEvent.time && `- ${selectedEvent.time}`}
          </p>
        </div>
      )}
    </Dialog>
  );
}
