'use client'
import React, { useState, useEffect } from "react";
import { SERVER_URL } from '@/utils/constants';
import { DailyPlan } from "@/components/DailyPlan"; // adjust relative path as needed
import { DailyQuickView } from "@/components/DailyQuickView";   // assumes DailyPlanView component exists
import ConnectRoom from "@/components/ConnectRoom";
import { BuildPlanAgent } from "@/components/BuildPlanAgent";
import { Button } from "@/components/ui/button";
import { Metadata } from "@/app/session/page";
import { parseDate } from "@/utils/dateUtil";
import { LoadingView } from "@/components/LoadingView";

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
  _id?: string;
  userid?: string;
  date: string;   // ISO YYYY‑MM‑DD
  week_day?: string;
  timezone?: string;
  locale?: string;
  version?: number;
  created_at?: Date;
  blocks: Block[];
}

export interface WhichDay{
    tomorrow: boolean
}

export default function DayPage(day : WhichDay) {
  const [tab, setTab] = useState<"quick" | "timeline">("quick");
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [userId, setUserId] = useState<string>("")
  const [buildPlanAgent, setBuildPlanAgent] = useState(false);
  const [modfiyPlanAgent, setModifyPlanAgent] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>();
  const [initDone, setInitDone] = useState<boolean>();


  useEffect(() => {
    async function fetchPlan() {

        const ures = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' });
        if (!ures.ok) { window.location.assign('/login'); return; }
        const user = await ures.json();
        if(!user.verified){
            window.location.assign('/login?verify=1');
            return;
        }
        if(user.stage == 0 || user.stage == 1){
            window.location.assign('/session');
            return;
        }
        setUserId(user.id)
        // Get local date in yyyy-mm-dd format
        const date = new Date()
        if(day.tomorrow) date.setDate(date.getDate() + 1)
        const thisDay = parseDate(date)
        const res = await fetch(`${SERVER_URL}/dailyPlans/fetchByDate/?date=${encodeURIComponent(thisDay)}`, {
        credentials: 'include',
        });
        if (res.ok) {
            const p = await res.json();
            setPlan(p);
        }
        setInitDone(true)
    }
    fetchPlan();
  }, []);

  const buildPlan = () => {
    const d = new Date()
    let time = d.toTimeString()
    let isTomorrow = "false"
    if(day.tomorrow) {
        d.setDate(d.getDate() + 1)
        time = "00:00:00"
        isTomorrow = "true"
    }
    const metadata : Metadata = {
      stage : "10",
      date : d.toLocaleDateString(),
      day : d.getDay(),
      time : time,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: "en-US",
      isTomorrow : isTomorrow,
      userId: userId
    }
    setMetadata(metadata);
    setBuildPlanAgent(true);
}

  if(!initDone){
    return (
      <div className='bg-black flex items-center justify-center min-h-screen'>
        <LoadingView centerMessage="take a deep breath" messages={[]} />
      </div>
    )
  }

  return (
    <div>
      {!plan && !buildPlanAgent && (
        <div className="min-h-screen flex flex-col justify-center items-center gap-4">
          <p className="text-white">Just talk to AI for 2 mins and Build your plan.</p>
          <Button variant="outline" className="bg-blue-600" onClick={buildPlan}>Build My Plan</Button>
        </div>
      )}
      {buildPlanAgent && (
        <ConnectRoom metadata={metadata}>
          <BuildPlanAgent onPlanReady={(p) => { setPlan(p); setBuildPlanAgent(false); }} />
        </ConnectRoom>
      )}
      {plan && (
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
      )}
    </div>
  );
}
