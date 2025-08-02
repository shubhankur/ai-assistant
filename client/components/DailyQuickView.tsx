import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DayPlan } from "@/app/today/page";
import ConnectRoom from "./ConnectRoom";
import { Button } from "./ui/button";
import { AgentVisualizer } from "./AgentVisualizer";
import { VoiceControlBar } from "./VoiceControlBar";
import { DisconnectButton, VoiceAssistantControlBar } from "@livekit/components-react";
import { Metadata } from "@/app/session/page";

/* ------------- Helpers ----------------- */
const catColor: Record<string, string> = {
  "work": "border-blue-500",
  "workout": "border-red-500",
  "wakeup": "border-amber-400",
  "sleep": "border-sky-400",
  "relax": "border-indigo-400",
  "routine": "border-emerald-500",
  "goals": "border-orange-500",
  "hobby": "border-pink-400",
  "other": "border-gray-500",
  // alias – meals share the routine palette
  "meals": "border-emerald-500"
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


export function DailyQuickView (plan: DayPlan) {
  const [year, month, day] = plan.date.split('-')

  console.log(plan.date)
  console.log(new Date(plan.date).toLocaleDateString())
  console.log(new Date(plan.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }))
  const [agent, setAgent] = useState<Boolean>(false);
  const [metadata, setMetadata]= useState<Metadata>();
  const activateAI = () => {
      setAgent(true);
      const metadataJsonString = `{"stage": "start_day_ai","current_plan": ${JSON.stringify(plan)}}`;
      setMetadata(JSON.parse(metadataJsonString));
  }
  const deactivateAI = () => {
    setAgent(false);
    //If required send text to worker to disconnect
  }

  function DailyQuickViewAgent(){
    return (
      <div className="flex flex-col items-center">
        <AgentVisualizer/>
        <div className="flex items-center">
          <VoiceControlBar/>
          <DisconnectButton onClick={deactivateAI}>{'X'}</DisconnectButton>
        </div>
      </div>
    )
  }

  return(
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="flex items-center justify-center gap-2 text-white mb-2">
    {agent && metadata &&
        <ConnectRoom metadata={metadata}>
          <DailyQuickViewAgent/>
        </ConnectRoom>
      }
      {!agent &&
        <Button variant="outline" className="bg-blue-600" onClick={activateAI}>Hey AI!</Button>
      }
    </div>
    <div className="flex items-center gap-2 text-white mb-2">
      <Calendar size={18} />
      <h2 className="text-xl font-semibold">{parseInt(month)}/{parseInt(day)}/{year}</h2>
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
