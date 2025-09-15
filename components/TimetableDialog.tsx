import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Settings,
  Trash2,
  Bell,
  Plus,
  Menu,
  X,
} from "lucide-react";

// توليد أيام الشهر
const generateDays = (month: number, year: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = [];
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }
  return daysArray;
};

export default function CalendarApp() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const days = generateDays(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleString("en-US", {
    month: "long",
  });

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="h-screen flex bg-[#0f172a] text-white">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-[#1e293b] p-6 flex-col justify-between">
        <div>
          <div className="text-5xl font-bold mb-8">
            {today.getDate()}
            <div className="text-lg font-normal text-gray-400">
              {today.toLocaleString("en-US", { month: "long" })}{" "}
              {today.getFullYear()}
            </div>
          </div>

          <nav className="space-y-4">
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <CalendarDays /> Calendar
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <ClipboardList /> Events
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <FileText /> Notes
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <Bell /> Reminders
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <FileText /> Documents
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <Trash2 /> Trash
            </button>
            <button className="flex items-center gap-3 hover:text-orange-400 transition">
              <Settings /> Settings
            </button>
          </nav>
        </div>

        <button className="bg-orange-500 text-white flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-orange-600 transition mt-6">
          <Plus /> Add Event
        </button>
      </aside>

      {/* Sidebar (Mobile Drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#1e293b] p-6 flex flex-col justify-between">
            <div>
              <div className="text-4xl font-bold mb-6">
                {today.getDate()}
                <div className="text-base font-normal text-gray-400">
                  {today.toLocaleString("en-US", { month: "long" })}{" "}
                  {today.getFullYear()}
                </div>
              </div>

              <nav className="space-y-4">
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <CalendarDays /> Calendar
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <ClipboardList /> Events
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <FileText /> Notes
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <Bell /> Reminders
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <FileText /> Documents
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <Trash2 /> Trash
                </button>
                <button className="flex items-center gap-3 hover:text-orange-400 transition">
                  <Settings /> Settings
                </button>
              </nav>
            </div>

            <button className="bg-orange-500 text-white flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-orange-600 transition mt-6">
              <Plus /> Add Event
            </button>
          </div>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <h2 className="text-xl font-semibold">
            {monthName} {currentYear}
          </h2>
          <div />
        </div>

        {/* Header (Desktop) */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg hover:bg-[#1e293b] transition"
          >
            <ChevronLeft />
          </button>
          <h2 className="text-2xl font-semibold">
            {monthName} {currentYear}
          </h2>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-[#1e293b] transition"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-gray-400 font-medium mb-2"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const isToday =
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear();

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`h-20 rounded-lg flex items-center justify-center transition 
                  ${
                    isToday
                      ? "bg-orange-500 text-white font-bold"
                      : "bg-[#1e293b] hover:bg-[#334155]"
                  }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Dialog لما يضغط يوم */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] p-6 rounded-xl w-96">
              <h3 className="text-xl mb-4">
                Events for{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <p className="text-gray-400">No events yet.</p>
              <button
                onClick={() => setSelectedDate(null)}
                className="mt-4 bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
