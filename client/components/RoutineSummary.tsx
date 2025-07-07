'use client'
import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/* ---------------- Types ---------------- */
export type Category =
  | "work"
  | "workout"   // gym, runs, sports
  | "sleep"      // sleep blocks
  | "relax"    // reading, meditation, unwind
  | "routine"    // meals, hygiene, misc daily
  | "goal"       // side‑projects, learning
  | "other";

export interface ActivityBlock {
  start: string; // HH:MM or HH:MM+1
  end: string;   // HH:MM or HH:MM+1
  activityName: string;
  location?: string;
  category?: Category;
  details?: string;
}

export interface DayTimeline {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  timeline: ActivityBlock[];
}

export interface WeekPreview {
  days: DayTimeline[];
}

/* ------------- Helpers ------------------- */
const dayFull: Record<DayTimeline["day"], string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday"
};

const catColor: Record<Category, string> = {
  work: "bg-blue-600",
  workout: "bg-red-600",
  sleep: "bg-cyan-600",
  relax: "bg-purple-600",
  routine: "bg-emerald-600",
  goal: "bg-amber-600",
  other: "bg-gray-500"
};

const tz = "America/New_York";

const to12h = (t: string) => {
  const nextDay = t.includes("+1");
  const [hStr, mStr] = t.replace("+1", "").split(":");
  const date = new Date();
  date.setHours(parseInt(hStr) % 24, parseInt(mStr));
  const fmt = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz
  });
  return nextDay ? fmt + " (+1)" : fmt;
};

const segmentText = (a: ActivityBlock) => {
  const time = `${to12h(a.start)}–${to12h(a.end)}`;
  const loc = a.location ? ` @ ${a.location}` : "";
  return `${a.activityName} (${time}${loc})`;
};

/* ------------- Component ----------------- */
interface Props {
  data?: WeekPreview;
}

export const RoutineSummary: React.FC<Props> = ({ data }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data && data.days.map((d) => {
        const isCollapsed = collapsed[d.day];
        return (
          <div key={d.day} className="rounded-xl bg-gray-800 shadow-md text-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <h3 className="font-semibold text-lg">{dayFull[d.day]}</h3>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [d.day]: !c[d.day] }))}
                className="p-1 rounded hover:bg-gray-700 transition"
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
            {/* Body */}
            {!isCollapsed && (
              <div className="flex flex-wrap gap-2 p-4 text-sm">
                {d.timeline.map((a, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${catColor[a.category ?? "other"]} bg-opacity-80`}
                  >
                    {segmentText(a)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
