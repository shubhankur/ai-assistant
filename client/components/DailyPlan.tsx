import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Category, DayPlan, Block } from "@/app/day/page";
import { stat } from "fs";

/* ------------------------ Style Map ---------------------------------- */
const catBg: Record<string, string> = {
    "work": "bg-blue-600/80", "workout": "bg-red-600/80", "sleep": "bg-cyan-600/80", "relax": "bg-purple-600/80",
    "routine": "bg-emerald-600/80", "goals": "bg-amber-600/80", "hobby": "bg-pink-600/80", "other": "bg-gray-600/60"
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

/* ------------------------ Functions ------------------------------- */
const onChange = (b: BlockWithGroupId[]) => {
    //update DB
}

/* ------------------------ Component ---------------------------------- */
interface Props {
    date: string
    blocks: Block[]
}

interface BlockWithGroupId extends Block {
    groupId: string;
}

export function DailyPlan(plan: Props) {
    // ensure every block has groupId
    const [state, setState] = useState<BlockWithGroupId[]>();
    useEffect(() => {
        const received_blocks: Block[] = plan.blocks;
        const init: BlockWithGroupId[] = received_blocks.map(block => ({
            ...block,
            groupId: uuid()
        }));
        setState(init)
    },[plan])

    if(!state){
        return (
            <div>
                Did not receive blocks
            </div>
        )
    }
    
    const [editing, setEditing] = useState<number | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => { if (editing !== null) inputRef.current?.focus(); }, [editing]);

    /* build slots */
    const sorted = [...state].sort((a, b) => hhmmToDate(a.start).getTime() - hhmmToDate(b.start).getTime());
    const firstActive = sorted[0];
    const start = hhmmToDate(firstActive.start);
    const firstSleep = sorted.find(b => b.name.toLowerCase() === "sleep");
    const endTs = firstSleep ? hhmmToDate(firstSleep.start).getTime() + MS30 * 2 : hhmmToDate(sorted.at(-1)!.end).getTime();
    type Slot = {
        time: string,
        block?: BlockWithGroupId,
        idx?: number,
        slotStart: Date
    };
    const slots: Slot[] = [];
    for (let t = start.getTime(); t < endTs; t += MS30) {
        const d = new Date(t);
        const idx = sorted.findIndex(b => hhmmToDate(b.start).getTime() <= t && hhmmToDate(b.end).getTime() > t);
        const blk = idx >= 0 ? sorted[idx] : undefined; 
        slots.push({ 
            time: fmt(d), 
            block: blk?.category === "sleep" ? { ...blk, name: "Sleep" } : blk, 
            idx: idx >= 0 ? idx : undefined, 
            slotStart: d 
        });
    }

    /* split helper */
    const splitBlock = (blocks: BlockWithGroupId[], idx: number, slotStart: Date): BlockWithGroupId[] => {
        const blk = blocks[idx];
        const st = hhmmToDate(blk.start), ed = hhmmToDate(blk.end);
        if (ed.getTime() - st.getTime() === MS30) return blocks;
        const slotEnd = new Date(slotStart.getTime() + MS30);
        const frags: BlockWithGroupId[] = [];
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
        next[bi] = { ...next[bi], name: inputRef.current.value.trim() || next[bi].name };
        setState(next); onChange(next); setEditing(null);
    };
    const saveAll = (si: number) => {
        const sl = slots[si]; if (!sl.block || !inputRef.current) return;
        let next = sl.idx !== undefined ? splitBlock(state, sl.idx, sl.slotStart) : { ...state };
        const gid = sl.block.groupId;
        next = next.map(b => b.groupId === gid ? { ...b, name: inputRef.current!.value.trim() || b.name } : b);
        setState(next); onChange(next); setEditing(null);
    };
    console.log(editing)
    /* render */
    return (
        <div className="max-w-xl mx-auto bg-gray-900 rounded-xl p-4 space-y-2 text-gray-100">
            <h2 className="text-lg font-semibold mb-2 select-none">{new Date(plan.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h2>
            {slots.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                    <div className="w-20 text-xs text-gray-400 select-none">{s.time}</div>
                    {!s.block ? (
                        <div className="flex-1 border border-dashed border-gray-600 rounded-md h-6" />
                    ) : (
                        <div className="relative flex-1">
                            {editing === i ? (
                                <>
                                    <textarea ref={inputRef} defaultValue={s.block.name} rows={2} className={`w-full rounded-md p-2 text-xs resize-none ${catBg[s.block.category]}`} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveOne(i); } }} />
                                    <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 flex flex-col gap-1">
                                        <button className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600" title="Save this slot" onClick={() => saveOne(i)}><ArrowRight size={16} /></button>
                                        <button className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600" title="Save all slots of this block" onClick={() => saveAll(i)}><ArrowDown size={16} /></button>
                                    </div>
                                </>
                            ) : (
                                <button className={`w-full rounded-md px-2 py-1 text-left text-xs ${catBg[s.block.category]} hover:ring-2 ring-white/40`} onDoubleClick={() => setEditing(i)} title="Double-click to edit">{s.block.name}</button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};