'use client'
import React, { useState, useEffect } from "react";
import { SERVER_URL } from '@/utils/constants';
import { DailyPlan } from "@/components/DailyPlan"; // adjust relative path as needed
import { DailyQuickView } from "@/components/DailyQuickView";   // assumes DailyPlanView component exists


/* --------------- Types --------------- */
export type Category =
  | "work"
  | "workout"
  | "meals"
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

export default function DailyPage() {
  const [tab, setTab] = useState<"quick" | "timeline">("quick");
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [startAgent, setStartAgent] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      const ures = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' });
      if (!ures.ok) { window.location.assign('/login'); return; }
      const user = await ures.json();
      if(!user.verified){
        window.location.assign('/login?verify=1');
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${SERVER_URL}/dailyPlans?date=${encodeURIComponent(today)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const p = await res.json();
        setPlan(p);
      } else {
        const dailyPlanFromSessionStorage = sessionStorage.getItem("currentPlan")
        if(dailyPlanFromSessionStorage) {
          const tempPlan : DayPlan = JSON.parse(dailyPlanFromSessionStorage)
          const today = new Date().toISOString().split("T")[0];
          console.log(today)
          const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
          console.log(tomorrow)
          console.log(tempPlan.date)
          const whichDay = tempPlan.date === today ? 'today' : tempPlan.date === tomorrow ? 'tomorrow' : null;
          console.log("Day in session storage is ", whichDay)
          if(whichDay) setPlan(tempPlan)
          else {
          //sessionStorage.removeItem("currentPlan")
          setStartAgent(true);
        }
      } else{
        setStartAgent(true);
      }
    }
    }
    fetchPlan();
  }, []);

  if(!plan){
    return (
      <div>
        No Plan Received
      </div>
    )
  }

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
      {tab === "quick" ? <DailyQuickView {...plan} /> : <DailyPlan {...plan}/>}
    </div>
  );
}
