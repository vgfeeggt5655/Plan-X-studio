import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function TaskDialog({ tasks }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const uniqueDays = [...new Set(tasks.map((task) => task.date))].sort();

  useEffect(() => {
    if (!tasks) return;
    const todayTasks = tasks.filter((t) => t.date === today);
    const pastUnfinished = tasks.filter(
      (t) => t.date < today && !t.completed
    ).map((t) => ({ ...t, warning: true }));

    setFilteredTasks([...todayTasks, ...pastUnfinished]);
  }, [tasks]);

  const nextDay = () => {
    if (currentDayIndex < uniqueDays.length - 1) {
      setCurrentDayIndex((prev) => prev + 1);
    }
  };

  const prevDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex((prev) => prev - 1);
    }
  };

  const progress =
    filteredTasks.length === 0
      ? 0
      : (filteredTasks.filter((t) => t.completed).length /
          filteredTasks.length) *
        100;

  const handleOpen = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(true);
    }, 600); // محاكاة loading
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2 shadow-md"
          onClick={handleOpen}
        >
          مهامي
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[90%] rounded-2xl p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevDay}
                  disabled={currentDayIndex === 0}
                >
                  <ChevronLeft />
                </Button>
                {uniqueDays[currentDayIndex] || "اليوم"}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextDay}
                  disabled={currentDayIndex === uniqueDays.length - 1}
                >
                  <ChevronRight />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <Progress
              value={progress}
              className="h-2 rounded-full my-3 bg-gray-200"
            />

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, i) => (
                  <Card
                    key={i}
                    className={`shadow-sm rounded-xl ${
                      task.warning
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <CardContent className="p-3 flex justify-between items-center">
                      <span
                        className={`font-medium ${
                          task.warning ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {task.title}
                      </span>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="w-5 h-5 accent-blue-600"
                      />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">
                  لا توجد مهام لهذا اليوم 🎉
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
