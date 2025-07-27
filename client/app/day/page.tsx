'use client'
import React, { useState, useEffect } from "react";
import { DailyPlan } from "@/components/DailyPlan"; // adjust relative path as needed
import { DailyQuickView } from "@/components/DailyQuickView";   // assumes DailyPlanView component exists


/* --------------- Types --------------- */
export type Category =
  | "work"
  | "workout"
  | "sleep"
  | "relax"
  | "routine"
  | "goals"
  | "hobby"
  | "other";

export interface Block {
  start: string;   // HH:MM
  end: string;     // HH:MM
  name: string;
  category: string;
  location?: string;
  details?: string;
}

export interface DayPlan {
  date: string;   // ISO YYYY‑MM‑DD (optional for future use)
  blocks: Block[];
}

/* =========================================================================
   PAGE — Top Tabs: Quick View | 30‑Min View
   -------------------------------------------------------------------------
   • Quick View   → renders <DailyPlanView />  (compact anchor list)
   • 30‑Min View → renders <DailyTimeline />   (editable timeline)
   ======================================================================= */

const sample = {
    "date" : "07-26-2025",
    "blocks": [
        { start: "07:00", end: "07:30", name: "Meditation", category: "relax" },
        { start: "07:30", end: "08:00", name: "Breakfast", category: "routine" },
        { start: "09:00", end: "12:00", name: "Client Work", category: "work" },
        { start: "12:00", end: "13:00", name: "Lunch", category: "routine" },
        { start: "13:00", end: "17:00", name: "Client Work", category: "work" },
        { start: "18:00", end: "19:00", name: "Gym Workout", category: "workout" },
        { start: "22:30", end: "07:00+1", name: "Sleep", category: "sleep" }
    ]
}

export default function DailyPage() {
  const [tab, setTab] = useState<"quick" | "timeline">("quick");
  const [plan, setPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      if (planParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(planParam));
          setPlan(parsed);
        } catch (e) {
          setPlan(null);
        }
      }
    }
  }, []);

  const displayPlan = plan || sample; //ToDO: Remove Sample, its just for now to test easily

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 space-y-6">
      {/* tabs */}
      <div className="flex gap-4 justify-center border-b border-gray-700 pb-2">
        {([
          { key: "quick", label: "Quick View" },
          { key: "timeline", label: "30‑Min View" }
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              `px-4 py-1 rounded-t-md text-sm font-medium ` +
              (tab === t.key ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* view */}
      {tab === "quick" ? <DailyQuickView {...displayPlan}  /> : <DailyPlan {...displayPlan}/>}
    </div>
  );
}
