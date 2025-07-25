import React from "react";
import { Calendar } from "lucide-react";
import { Category, DayPlan, Block } from "@/app/day/page";

/* ------------- Helpers ----------------- */
const catColor: Record<string, string> = {
  "work": "border-blue-500",
  "workout": "border-red-500",
  "sleep": "border-cyan-500",
  "relax": "border-purple-500",
  "routine": "border-emerald-500",
  "goals": "border-amber-500",
  "hobby": "border-pink-500",
  "other": "border-gray-500"
};

const tz = "America/New_York";
const to12h = (t: string) => {
  const next = t.includes("+1");
  const [h, m] = t.replace("+1", "").split(":").map(Number);
  const d = new Date();
  d.setHours(h % 24, m);
  const fmt = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
  return next ? fmt + " (+1)" : fmt;
};


export function DailyQuickView (plan:DayPlan) {
  return(
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="flex items-center gap-2 text-white mb-2">
      <Calendar size={18} />
      <h2 className="text-xl font-semibold">{new Date(plan.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h2>
    </div>

    <div className="space-y-3">
      {plan.blocks.map((b, i) => (
        <div key={i} className={`border-l-4 p-3 bg-gray-800 rounded-md text-gray-100 ${catColor[b.category]}`}>          
          <div className="flex justify-between text-sm font-medium">
            <span>{b.name}</span>
            <span className="text-gray-400">{to12h(b.start)} – {to12h(b.end)}</span>
          </div>
          {b.location && <div className="text-xs text-gray-400 mt-0.5">📍 {b.location}</div>}
          {b.details && <div className="text-xs text-gray-400 mt-0.5">{b.details}</div>}
        </div>
      ))}
    </div>
  </div>
  );
}
