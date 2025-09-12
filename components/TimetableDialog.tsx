import React, { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

type DayEvent = {
  type: "lecture" | "exam" | "holiday";
  title: string;
  time?: string;
};

export default function TimetableDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [timetable, setTimetable] = useState<Record<string, DayEvent>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 🟢 تحميل الـ JSON من public
  useEffect(() => {
    fetch("/data/timetable.json")
      .then((res) => res.json())
      .then((data) => setTimetable(data))
      .catch((err) => console.error("Error loading timetable:", err));
  }, []);

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

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const event = getEvent(dateStr);

      let bgColor = "bg-white";
      if (event?.type === "lecture") bgColor = "bg-blue-100";
      if (event?.type === "exam") bgColor = "bg-red-200";
      if (event?.type === "holiday") bgColor = "bg-green-200";

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`p-2 rounded-lg border hover:scale-105 transition-all ${bgColor}`}
        >
          {day}
        </button>
      );
    }

    return (
      <div key={monthIndex} className="mb-8">
        <h2 className="text-lg font-bold mb-2">{months[monthIndex]}</h2>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  const selectedEvent = selectedDate ? getEvent(selectedDate) : null;

  return (
    <Dialog open={open} onClose={onClose}>
      <h1 className="text-2xl font-bold mb-4">📅 Academic Timetable</h1>
      <div className="h-[60vh] overflow-y-auto pr-2">
        {months.map((_, i) => renderCalendar(i))}
      </div>

      {selectedEvent && (
        <div className="mt-4 p-4 bg-gray-100 rounded-xl">
          <h2 className="font-bold">Details for {selectedDate}</h2>
          <p>
            <span className="font-semibold">{selectedEvent.type.toUpperCase()}:</span>{" "}
            {selectedEvent.title} {selectedEvent.time && `- ${selectedEvent.time}`}
          </p>
        </div>
      )}
    </Dialog>
  );
}
