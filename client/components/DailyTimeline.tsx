import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowDown, Pencil } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Category, DayPlan, Block } from "@/components/DayPage";
import { SERVER_URL } from "@/utils/constants";

/* ------------------------ Style Map ---------------------------------- */
const catBg: Record<string, string> = {
    "work": "bg-blue-600/80",
    "workout": "bg-red-600/80",
    "wakeup": "bg-amber-400/80",
    "sleep": "bg-sky-400/70",
    "relax": "bg-indigo-500/70",
    "routine": "bg-emerald-600/80",
    "goals": "bg-orange-500/80",
    "hobby": "bg-pink-500/70",
    "other": "bg-gray-600/60",
    "meals": "bg-emerald-600/80"
};

/* ------------------------ Time Helpers ------------------------------- */
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MS30 = 1.8e6; //30 minutes
const hhmmToDate = (s: string) => {
    const n = s.includes("+1");
    const [h, m] = s.replace("+1", "").split(":").map(Number);
    const d = new Date();
    if (n) d.setDate(d.getDate() + 1);
    d.setHours(h % 24, m, 0, 0);
    return d;
};
const dateToHHMM = (d: Date, n = false) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}${n ? "+1" : ""}`;
const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });



/* ------------------------ Component ---------------------------------- */

export function DailyTimeline(plan: DayPlan) {
    // ensure every block has groupId
    const [year, month, day] = plan.date.split('-')
    const [state, setState] = useState<Block[]>();
    const [slotStatus, setSlotStatus] = useState<Record<string, boolean>>({});

    const open_blk = {
        start:"",
        end:"",
        groupId:"",
        name: "Open",
        category: "other"
    }
    useEffect(() => {
        const received_blocks: Block[] = plan.blocks;
        // 1) Find a "Wake Up" block (case-insensitive)
        const wakeUp = received_blocks.find(b => b.name.toLowerCase() === "wake up");
        const wakeUpMinutes = wakeUp ? (() => {
            const [h, m] = wakeUp.start.replace("+1", "").split(":").map(Number);
            return h * 60 + m;
        })() : null;
        const addPlusIfNeeded = (time: string): string => {
            if (time.includes("+1")) return time;       // already tagged
            const [h, m] = time.split(":").map(Number);
            const mins = h * 60 + m;
            // Any time strictly before wake-up belongs to *next* day
            if(wakeUpMinutes){
                return mins < wakeUpMinutes ? `${time}+1` : time;
            } else {
                return mins < 240 ? `${time}+1` : time;
            }
        };
        const init: Block[] = received_blocks.map(block => ({
            ...block,
            start: addPlusIfNeeded(block.start),
            end: addPlusIfNeeded(block.end),
            groupId: block.groupId || uuid()
        }));
        setState(init);
    }, [plan]);

    useEffect(() => {
        async function fetchSlots(){
            if(!plan._id) return;
            try{
                const res = await fetch(`${SERVER_URL}/slots/${plan._id}`, {credentials:'include'});
                if(res.ok){
                    const data = await res.json();
                    const map: Record<string, boolean> = {};
                    data.forEach((sl: any) => { map[sl.start] = sl.completed; });
                    setSlotStatus(map);
                }
            } catch(err){
                console.error(err);
            }
        }
        fetchSlots();
    }, [plan._id]);

    const [editing, setEditing] = useState<number | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    // Persist updated plan to server, incrementing version automatically
    const persistPlan = async (blocks: Block[]) => {
        try {
            // Strip internal UI fields before sending
            const cleanBlocks: Block[] = blocks.map(b => ({ ...b }));
            const payload = {
                date: plan.date,
                week_day: plan.week_day,
                timezone: plan.timezone,
                locale: plan.locale,
                blocks: cleanBlocks,
            } as const;

            await fetch(`${SERVER_URL}/dailyPlans/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error('Failed to save daily plan', err);
        }
    };
    useEffect(() => { if (editing !== null) inputRef.current?.focus(); }, [editing]);


    if(!state){
        return (
            <div>
                Did not receive blocks
            </div>
        )
    }

    /* build slots */
    const sorted = [...state].sort((a, b) => hhmmToDate(a.start).getTime() - hhmmToDate(b.start).getTime());
    const firstActive = sorted[0];
    const start = hhmmToDate(firstActive.start);
    const firstSleep = sorted.find(b => b.name.toLowerCase() === "sleep");
    const endTs = firstSleep ? hhmmToDate(firstSleep.start).getTime() : hhmmToDate(sorted.at(-1)!.end).getTime();
    type Slot = {
        time: string,
        block?: Block,
        idx?: number,
        slotStart: Date
    };
    const slots: Slot[] = [];
    for (let t = start.getTime(); t < endTs; t += MS30) {
        const d = new Date(t);
        const idx = sorted.findIndex(b => hhmmToDate(b.start).getTime() <= t && hhmmToDate(b.end).getTime() > t);
        const blk = idx >= 0 ? sorted[idx] : open_blk; 
        slots.push({ 
            time: fmt(d), 
            block: blk, 
            idx: idx >= 0 ? idx : undefined, 
            slotStart: d 
        });
    }
    //push sleep block
    if(firstSleep){
        const sleepBlockEnds = endTs + MS30 * 2
        for (let t = hhmmToDate(firstSleep.start).getTime(); t < sleepBlockEnds; t += MS30){
            const d = new Date(t);
            const idx = sorted.indexOf(firstSleep)
            slots.push({ 
                time: fmt(d), 
                block: firstSleep, 
                idx: idx >= 0 ? idx : undefined, 
                slotStart: d 
            });
        }
    }

    console.log(slots)

    /* split helper */
    const splitBlock = (blocks: Block[], idx: number, slotStart: Date): Block[] => {
        const blk = blocks[idx];
        const st = hhmmToDate(blk.start), ed = hhmmToDate(blk.end);
        if (ed.getTime() - st.getTime() === MS30) return blocks;
        const slotEnd = new Date(slotStart.getTime() + MS30);
        const frags: Block[] = [];
        if (st < slotStart) frags.push({ 
            ...blk, 
            end: dateToHHMM(slotStart), 
            groupId: blk.groupId 
        });
        frags.push({ 
            ...blk, 
            start: dateToHHMM(slotStart), 
            end: dateToHHMM(slotEnd, blk.end.includes("+1")), 
            groupId: blk.groupId 
        });
        if (slotEnd < ed) frags.push({ 
            ...blk, 
            start: dateToHHMM(slotEnd, blk.end.includes("+1")), 
            end: blk.end, 
            groupId: blk.groupId 
        });
        return [...blocks.slice(0, idx), ...frags, ...blocks.slice(idx + 1)];
    };

    /* handlers */
    const saveOne = (si: number) => {
        const sl = slots[si];
        if (sl.idx === undefined || !inputRef.current) return;
        let next = splitBlock(state, sl.idx, sl.slotStart);
        const startKey = dateToHHMM(sl.slotStart);
        const bi = next.findIndex(b => b.start === startKey);
        const newName = inputRef.current.value.trim();
        const changed = newName && sl.block && newName !== sl.block.name;
        next[bi] = { ...next[bi], name: newName || next[bi].name, groupId: changed ? uuid() : next[bi].groupId };
        setState(next); persistPlan(next); setEditing(null);
    };
    
    const saveAll = (si: number) => {
        const sl = slots[si];
        if (!sl.block || !inputRef.current) return;
        const gid = sl.block.groupId;
        const newName = inputRef.current.value.trim();
    
        const next = state.map(b => 
            b.groupId === gid ? { ...b, name: newName || b.name } : b
        );
    
        setState(next);
        persistPlan(next);
        setEditing(null);
    };
    const toggleSlot = async (key: string, sl: Slot, checked: boolean) => {
        setSlotStatus(prev => ({ ...prev, [key]: checked }));
        try {
            await fetch(`${SERVER_URL}/slots/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    dailyPlanId: plan._id,
                    start: dateToHHMM(sl.slotStart),
                    end: sl.block?.end,
                    name: sl.block?.name,
                    category: sl.block?.category,
                    completed: checked
                })
            });
        } catch (err) {
            console.error(err);
        }
    };
    console.log(editing)
    /* render */
    return (
        <div className="max-w-xl mx-auto bg-gray-900 rounded-xl p-4 space-y-2 text-gray-100">
            <h2 className="text-lg font-semibold mb-2 select-none">{parseInt(month)}/{parseInt(day)}/{year}</h2>
            {slots.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-400 select-none">{s.time}</div>
                    {(() => {
                        const key = dateToHHMM(s.slotStart);
                        const checked = slotStatus[key] || false;
                        return (
                            <>
                                <input type="checkbox" checked={checked} onChange={e => toggleSlot(key, s, e.target.checked)} className="mt-1" />
                                {!s.block ? (
                                    <button className="flex-1 border border-dashed border-gray-600 rounded-md h-9 hover:ring-2 ring-white/40" />
                                ) : (
                                    <div className="relative flex-1">
                                        {editing === i ? (
                                            <>
                                                <textarea ref={inputRef} defaultValue={s.block.name} rows={2} className={`w-full rounded-md p-2 text-xs resize-none ${catBg[s.block.category]}`} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveOne(i); } }} />
                                                <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 flex flex-col gap-1">
                                                    <button className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600" title="Save this slot" onClick={() => saveOne(i)}><ArrowRight size={16} /></button>
                                                    {s.block.groupId && s.block.groupId!="" && <button className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600" title="Save all slots of this block" onClick={() => saveAll(i)}><ArrowDown size={16} /></button>}
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`w-full min-h-9 rounded-md px-2 py-1 text-xs flex items-center hover:ring-2 ring-white/40 ${catBg[s.block.category]} ${checked ? 'line-through' : ''}`}>
                                                <span className="flex-1 text-left">{s.block.name}</span>
                                                <button className="ml-2" onClick={() => setEditing(i)}><Pencil size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            ))}
        </div>
    );
};