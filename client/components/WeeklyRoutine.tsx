import React from "react";

/* ---------------- Schema Types ----------------- */
type Block = {
  start: string;
  end: string;
  label: string;
  category: "work" | "routine" | "hobby" | "goal" | "other";
  location?: string;
  details?: string;
  color?: string; // agent‑supplied override
};

type Day = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  blocks: Block[];
};

export type WeekData = {
  weekOf: string;
  intervalMinutes: number;
  days: Day[];
};

/* -------------- Helpers ------------------------- */
// Base colours by top‑level category
const categoryHex: Record<Block["category"], string> = {
  work: "#3b82f6",     // blue‑500
  routine: "#10b981",  // emerald‑500
  hobby: "#9333ea",    // purple‑600
  goal: "#f59e0b",     // amber‑500
  other: "#6b7280"      // gray‑500
};

// Specific routine anchors that deserve their own distinct colour
const specificHex: Record<string, string> = {
  sleep: "#06b6d4",     // cyan‑500
  workout: "#ef4444",   // red‑500
  gym: "#ef4444"        // map "Gym" to same red
};

const toMinutes = (t: string) => {
  const [h, m] = t.replace("+1", "").split(":").map(Number);
  return h * 60 + m;
};

const daysOrder: Day["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getBlockColor = (b: Block): string => {
  if (b.color) return b.color;
  const key = b.label.toLowerCase();
  if (specificHex[key]) return specificHex[key];
  return categoryHex[b.category];
};

/* -------------- Components ---------------------- */
const HOUR_LABEL_WIDTH = 60; // px
const HEADER_HEIGHT = 24; // px sticky day header height

const HourColumn: React.FC<{ totalHeight: number; stepPx: number; interval: number }> = ({ totalHeight, stepPx, interval }) => (
  <div
    className="relative select-none text-right pr-2"
    style={{ minWidth: HOUR_LABEL_WIDTH, height: totalHeight + HEADER_HEIGHT }}
  >
    {Array.from({ length: 25 }).map((_, i) => (
      <div
        key={i}
        className="absolute left-0 w-full text-[10px] text-white"
        style={{ top: HEADER_HEIGHT + (i * 60 * stepPx) / interval }}
      >
        {i === 24 ? "" : `${i}:00`}
      </div>
    ))}
  </div>
);

const DayColumn: React.FC<{ day: Day; stepPx: number; interval: number; totalHeight: number }> = ({ day, stepPx, interval, totalHeight }) => (
  <div className="relative border-l" style={{ minWidth: 160, height: totalHeight + HEADER_HEIGHT }}>
    {/* Sticky header */}
    <div
      className="sticky top-0 z-10 bg-white text-center text-sm font-semibold py-1 border-b"
      style={{ height: HEADER_HEIGHT }}
    >
      {day.day}
    </div>

    {day.blocks.map((b, i) => {
      const top = HEADER_HEIGHT + (toMinutes(b.start) / interval) * stepPx;
      const height = ((toMinutes(b.end) - toMinutes(b.start)) / interval) * stepPx;
      const bg = getBlockColor(b);
      const tooltip = `${b.label} (${b.start}-${b.end})${b.location ? ` @ ${b.location}` : ""}${b.details ? ` • ${b.details}` : ""}`;
      return (
        <div
          key={i}
          className="absolute left-1 right-1 rounded-sm text-white text-xs px-1 overflow-hidden"
          style={{ top, height, backgroundColor: bg }}
          title={tooltip}
        >
          {height > 14 ? b.label : ""}
        </div>
      );
    })}
  </div>
);

const WeeklyRoutineTimeline: React.FC<{ data: WeekData }> = ({data}) => {
  const interval = data.intervalMinutes;
  const stepPx = 20;
  const totalHeight = (1440 / interval) * stepPx;
  const ordered = daysOrder.map((d) => data.days.find((x) => x.day === d) || { day: d, blocks: [] });

  return (
    <div className="flex overflow-x-auto h-screen">
      <div className="flex overflow-y-auto">
        <HourColumn totalHeight={totalHeight} stepPx={stepPx} interval={interval} />
        {ordered.map((d) => (
          <DayColumn key={d.day} day={d} stepPx={stepPx} interval={interval} totalHeight={totalHeight} />
        ))}
      </div>
    </div>
  );
};

export default WeeklyRoutineTimeline;
