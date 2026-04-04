"use client";

import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  passed: "var(--green)",
  failed: "var(--red)",
  grace: "var(--yellow)",
  respite: "var(--blue)",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarGrid({ checkinMap }: { checkinMap: Record<string, string> }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="forge-panel" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="forge-btn forge-btn-ghost" style={{ padding: "0.375rem 0.75rem" }}>←</button>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: "0.05em" }}>
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="forge-btn forge-btn-ghost" style={{ padding: "0.375rem 0.75rem" }}>→</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-dim)", textAlign: "center", padding: "0.375rem 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = checkinMap[dateKey];
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isFuture = new Date(year, month, day) > today;

          return (
            <div
              key={day}
              title={status ? `${dateKey}: ${status}` : dateKey}
              style={{
                aspectRatio: "1",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: isToday ? 700 : 400,
                background: status ? `${STATUS_COLORS[status]}22` : isFuture ? "transparent" : "rgba(30,30,46,0.5)",
                border: isToday ? "2px solid var(--text-secondary)" : status ? `1px solid ${STATUS_COLORS[status]}66` : "1px solid transparent",
                color: status ? STATUS_COLORS[status] : isFuture ? "var(--text-dim)" : "var(--text-secondary)",
                cursor: status ? "pointer" : "default",
                transition: "all 0.15s",
                minHeight: "36px",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
