'use client'
import React, { useState, useEffect } from "react";
import { SERVER_URL } from '@/utils/constants';
import { DailyTimeline } from "@/components/DailyTimeline"; // adjust relative path as needed
import { DailyQuickView } from "@/components/DailyQuickView";   // assumes DailyPlanView component exists
import ConnectRoom from "@/components/ConnectRoom";
import { BuildPlanAgent } from "@/components/BuildPlanAgent";
import { Button } from "@/components/ui/button";
import { Metadata } from "@/app/session/page";
import { parseDate } from "@/utils/dateUtil";
import { LoadingView } from "@/components/LoadingView";
import { ModifyPlanAgent } from "./ModifyPlanAgent";

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
  groupId: string;
  totalSlots?: number;
  completedSlots?: number;
}

export interface DayPlan {
  _id?: string;
  userid?: string;
  date: string;   // YYYY‑MM‑DD
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
  const [buildPlanMetadata, setBuildPlanMetadata] = useState<Metadata>();
  const [modifyPlanMetadata, setModifyPlanMetadata] = useState<Metadata>();
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
        } else {
          //try to get from weekly routine
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          const week_day = days[date.getDay()]
          const res = await fetch(`${SERVER_URL}/weeklyRoutines`, {
            credentials: 'include',
            });
            if (res.ok) {
              try {
                const weekly_routine = await res.json()
                console.log(weekly_routine)
                console.log(week_day)
                const day_routine = weekly_routine[week_day]
                let p: DayPlan = {
                  blocks: day_routine,
                  date: thisDay
                }

                setPlan(p)
              } catch (error) {
                // do nothing
              }
            }
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
      time : d.toTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: "en-US",
      isTomorrow : isTomorrow,
      userId: userId
    }
    setBuildPlanMetadata(metadata);
    setBuildPlanAgent(true);
  }

  const activateAI = () =>{
    const d = new Date()
    let time = d.toTimeString()
    let isTomorrow = "false"
    let stage = "20"
    if(day.tomorrow) {
        d.setDate(d.getDate() + 1)
        time = "00:00:00"
        stage = "30"
    }
    const metadata : Metadata = {
      stage : stage,
      date : d.toLocaleDateString(),
      day : d.getDay(),
      time : time,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: "en-US",
      currentPlan:plan,
      userId: userId
    }
    setModifyPlanMetadata(metadata);
    setModifyPlanAgent(true);
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
        <ConnectRoom metadata={buildPlanMetadata}>
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

        {!modfiyPlanAgent &&(
          <div className="flex items-center justify-center">
            <Button variant="outline" className="bg-blue-600" onClick={activateAI}>Hey AI!</Button>
          </div>
        )}

        {/* {!modfiyPlanAgent && !day.tomorrow &&(
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" className="bg-blue-600" onClick={activateAI}>Hey AI!</Button>
          </div>
        )}   */}

        {modfiyPlanAgent && (
          <ConnectRoom metadata={modifyPlanMetadata}>
            <ModifyPlanAgent onPlanReady={(p) => { 
                if(p) setPlan(p); 
                setModifyPlanAgent(false); 
              }} />
          </ConnectRoom>
        )}
        {/* view */}
        {tab === "quick" ? <DailyQuickView {...plan} /> : <DailyTimeline {...plan}/>}
      </div>
      )}
    </div>
  );
}
