import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Task = {
  time?: string;
  title: string;
  type: "lecture" | "exam" | "holiday";
};

type Timetable = {
  [date: string]: Task[];
};

interface TimetableDialogProps {
  open: boolean;
  onClose: () => void;
  timetable: Timetable;
}

const TimetableDialog: React.FC<TimetableDialogProps> = ({ open, onClose, timetable }) => {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (timetable[today]) {
      setTodayTasks(timetable[today]);
    } else {
      setTodayTasks([]);
    }
  }, [timetable, today]);

  const getDayColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-red-500 text-white";
      case "holiday":
        return "bg-green-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 bg-gradient-to-b from-indigo-700 to-purple-800 text-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            📅 جدول الترم الدراسي
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* التقويم */}
          <div className="bg-white rounded-xl text-black p-4 shadow">
            <div className="text-center font-bold text-lg mb-2">
              {new Date().toLocaleString("ar-EG", { month: "long", year: "numeric" })}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold">
              {["أح", "إث", "ثل", "أر", "خم", "جم", "سب"].map((d) => (
                <div key={d} className="p-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mt-2">
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const dateKey = `2025-09-${String(day).padStart(2, "0")}`;
                const tasks = timetable[dateKey];
                let color = "";
                if (tasks) {
                  if (tasks.some((t) => t.type === "exam")) color = "bg-red-500 text-white";
                  else if (tasks.some((t) => t.type === "holiday")) color = "bg-green-500 text-white";
                  else color = "bg-blue-500 text-white";
                }
                return (
                  <div
                    key={day}
                    className={`p-2 rounded cursor-pointer ${color}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* المهام اليومية */}
          <div className="bg-white rounded-xl text-black p-4 shadow">
            <h3 className="text-lg font-bold mb-3">📌 مهام اليوم</h3>
            {todayTasks.length > 0 ? (
              <ul className="space-y-2">
                {todayTasks.map((task, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded ${getDayColor(task.type)}`}
                  >
                    {task.time && <span className="mr-2 font-bold">{task.time}</span>}
                    {task.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">لا توجد مهام اليوم 🎉</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableDialog;
