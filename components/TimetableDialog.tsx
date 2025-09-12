import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type Event = {
  date: string; // "2025-09-15"
  type: "lecture" | "exam" | "holiday";
  title: string;
};

const sampleEvents: Event[] = [
  { date: "2025-09-15", type: "lecture", title: "Anatomy Lecture" },
  { date: "2025-09-20", type: "exam", title: "Physiology Midterm" },
  { date: "2025-09-25", type: "holiday", title: "National Holiday" },
  { date: "2025-10-03", type: "lecture", title: "Biochemistry Lecture" },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Props = {
  open: boolean;
  onClose: () => void;
};

const TimetableDialog: React.FC<Props> = ({ open, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate: Record<string, Event[]> = sampleEvents.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, Event[]>);

  const renderMonth = (monthIndex: number) => {
    const year = 2025;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: JSX.Element[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = eventsByDate[dateKey] || [];
      const bgColor =
        dayEvents.find(e => e.type === "exam") ? "bg-red-500 text-white" :
        dayEvents.find(e => e.type === "holiday") ? "bg-green-500 text-white" :
        dayEvents.find(e => e.type === "lecture") ? "bg-blue-500 text-white" :
        "bg-gray-100";

      cells.push(
        <button
          key={day}
          className={`p-2 rounded-md hover:scale-105 transition ${bgColor}`}
          onClick={() => setSelectedDate(dateKey)}
        >
          {day}
        </button>
      );
    }

    return (
      <div key={monthIndex} className="mb-8">
        <h3 className="text-lg font-semibold mb-2">{months[monthIndex]} {year}</h3>
        <div className="grid grid-cols-7 gap-2">
          <div className="text-center font-bold">Sun</div>
          <div className="text-center font-bold">Mon</div>
          <div className="text-center font-bold">Tue</div>
          <div className="text-center font-bold">Wed</div>
          <div className="text-center font-bold">Thu</div>
          <div className="text-center font-bold">Fri</div>
          <div className="text-center font-bold">Sat</div>
          {cells}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>📅 Academic Timetable</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {months.map((_, i) => renderMonth(i))}
        </div>

        {selectedDate && (
          <div className="mt-4 p-3 border rounded-lg bg-gray-50">
            <h4 className="font-bold">Events on {selectedDate}</h4>
            {eventsByDate[selectedDate] ? (
              <ul className="list-disc list-inside">
                {eventsByDate[selectedDate].map((ev, idx) => (
                  <li key={idx} className="capitalize">
                    {ev.type}: {ev.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No events</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TimetableDialog;
