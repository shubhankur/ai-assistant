import React, { useState, useRef } from "react";
import { Calendar, Check, Pencil } from "lucide-react";
import { DayPlan } from "@/components/DayPage";
import { SERVER_URL } from "@/utils/constants";

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
const MS30 = 1.8e6; //30 minutes
const hhmmToDate = (s: string) => {
  const n = s.includes("+1");
  const [h, m] = s.replace("+1", "").split(":").map(Number);
  const d = new Date();
  if (n) d.setDate(d.getDate() + 1);
  d.setHours(h % 24, m, 0, 0);
  return d;
};
const dateToHHMM = (d: Date, n = false) =>
  `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}${n ? "+1" : ""}`;
const to12h = (t: string) => {
  const next = t.includes("+1");
  const [h, m] = t.replace("+1", "").split(":").map(Number);
  const d = new Date();
  d.setHours(h % 24, m);
  const fmt = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
  return next ? fmt + " (+1)" : fmt;
};


const ProgressCircle = ({completed = 0, total = 0}: {completed?: number,total?: number}) => {
  if(total && completed === total){
    return <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><Check size={10} className="text-white"/></div>;
  }
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const pct = total ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const colors = ['#ef4444','#f97316','#facc15','#22c55e'];
  const color = colors[Math.min(Math.floor(pct * colors.length), colors.length-1)];
  return (
    <svg width="20" height="20">
      <circle cx="10" cy="10" r={radius} stroke="#555" strokeWidth="2" fill="none" />
      <circle cx="10" cy="10" r={radius} stroke={color} strokeWidth="2" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
  );
};

export function DailyQuickView (plan: DayPlan) {
  const [year, month, day] = plan.date.split('-')
  const [completed, setCompleted] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    plan.blocks.forEach((b, i) => {
      init[i] = !!b.total_slots && b.completed_slots === b.total_slots;
    });
    return init;
  });
  const touchStart = useRef<Record<number, number>>({});
  const handleSwipe = async (idx: number, done: boolean) => {
    setCompleted(prev => ({...prev, [idx]: done}));
    const block = plan.blocks[idx];
    block.completed_slots = done ? block.total_slots || 0 : 0;
    try{
      const startDate = hhmmToDate(block.start);
      const endDate = hhmmToDate(block.end);
      const reqs: Promise<any>[] = [];
      for(let t = startDate.getTime(); t < endDate.getTime(); t += MS30){
        const slotStart = new Date(t);
        reqs.push(fetch(`${SERVER_URL}/slots/complete`, {
          method: 'POST',
          headers:{'Content-Type':'application/json'},
          credentials:'include',
          body: JSON.stringify({
            dailyPlanId: plan._id,
            start: dateToHHMM(slotStart),
            end: dateToHHMM(new Date(t + MS30), block.end.includes('+1')),
            name: block.name,
            category: block.category,
            completed: done
          })
        }));
      }
      await Promise.all(reqs);
    }catch(e){console.error(e);}
  }
  return(
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="flex items-center gap-2 text-white mb-2">
      <Calendar size={18} />
      <h2 className="text-xl font-semibold">{parseInt(month)}/{parseInt(day)}/{year}</h2>
    </div>

    <div className="space-y-3">
      {plan.blocks.map((b, i) => (
        <div
          key={i}
          className={`border-l-4 p-3 bg-gray-800 rounded-md text-gray-100 ${catColor[b.category]} ${completed[i] ? 'line-through' : ''}`}
          onTouchStart={e => {touchStart.current[i] = e.changedTouches[0].clientX;}}
          onTouchEnd={e => {
            const diff = e.changedTouches[0].clientX - (touchStart.current[i] || 0);
            if(diff > 40) handleSwipe(i, true); else if(diff < -40) handleSwipe(i, false);
          }}
        >
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <ProgressCircle completed={b.completed_slots} total={b.total_slots} />
              {b.name}
              <button onClick={()=>{
                const nn = prompt('Rename slot', b.name) || b.name;
                plan.blocks[i].name = nn; // local update
                setCompleted({...completed});
              }}><Pencil size={12}/></button>
            </span>
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
