<div className="flex flex-1 overflow-hidden">
  {/* Calendar (1/3) */}
  <div className="w-1/3 border-r border-slate-700/50 bg-slate-800/50 p-4">
    {renderCalendar(currentMonth, currentYear)}
  </div>

  {/* Event Details (2/3) */}
  <div className="flex-1 p-6 flex flex-col justify-center">
    {selectedEvent ? (
      <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-5xl">
            {getEventStyle(selectedEvent.type).icon}
          </span>
          <h3 className="text-2xl font-extrabold text-white">
            {selectedEvent.title}
          </h3>
        </div>
        <p className="text-slate-300 mb-4 text-lg">
          {new Date(selectedDate!).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {selectedEvent.time && (
          <p className="text-slate-200 text-xl font-semibold mb-2">
            ⏰ {selectedEvent.time}
          </p>
        )}
        {selectedEvent.location && (
          <p className="text-slate-200 text-xl font-semibold">
            📍 {selectedEvent.location}
          </p>
        )}
      </div>
    ) : (
      <p className="text-slate-500 text-center">Select a date to view details</p>
    )}
  </div>
</div>
