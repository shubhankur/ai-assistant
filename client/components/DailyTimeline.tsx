import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowDown, Pencil } from "lucide-react";
import { v4 as uuid } from "uuid";
import { DayPlan, Block } from "@/components/DayPage";
import { SERVER_URL } from "@/utils/constants";

/* ------------------------ Style Map ---------------------------------- */
const catBg: Record<string, string> = {
  work: "bg-blue-600/80",
  workout: "bg-red-600/80",
  wakeup: "bg-amber-400/80",
  sleep: "bg-sky-400/70",
  relax: "bg-indigo-500/70",
  routine: "bg-emerald-600/80",
  goals: "bg-orange-500/80",
  hobby: "bg-pink-500/70",
  other: "bg-gray-600/60",
  meals: "bg-emerald-600/80",
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
const dateToHHMM = (d: Date, n = false) =>
  `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}${n ? "+1" : ""}`;
const fmt = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });

/* ------------------------ Component ---------------------------------- */

export function DailyTimeline(plan: DayPlan) {
  const [year, month, day] = plan.date.split("-");
  const [blocks, setBlocks] = useState<Block[]>();
  type Slot = {
    time: string;
    blockIndex?: number;
    slotStart: Date;
    completed: boolean;
  };
  const [slots, setSlots] = useState<Slot[]>([]);

  const open_blk = {
    start: "",
    end: "",
    groupId: "",
    name: "Open",
    category: "other",
  };

  // Build slots from blocks and optional completion map
  const buildSlots = (
    blks: Block[],
    completion: Record<string, boolean> = {}
  ) => {
    const sorted = [...blks].sort(
      (a, b) => hhmmToDate(a.start).getTime() - hhmmToDate(b.start).getTime()
    );
    const firstActive = sorted[0];
    const start = hhmmToDate(firstActive.start);
    const firstSleep = sorted.find((b) => b.name.toLowerCase() === "sleep");
    const endTs = firstSleep
      ? hhmmToDate(firstSleep.start).getTime()
      : hhmmToDate(sorted.at(-1)!.end).getTime();
    const idMap: Record<string, number> = {};
    blks.forEach((b, i) => {
      if (b.groupId) idMap[b.groupId] = i;
    });
    const counts: Record<number, { total: number; completed: number }> = {};
    const built: Slot[] = [];
    for (let t = start.getTime(); t < endTs; t += MS30) {
      const d = new Date(t);
      const idx = sorted.findIndex(
        (b) =>
          hhmmToDate(b.start).getTime() <= t &&
          hhmmToDate(b.end).getTime() > t
      );
      const blk = idx >= 0 ? sorted[idx] : open_blk;
      const startKey = dateToHHMM(d);
      const comp = !!completion[startKey];
      const origIdx = blk.groupId ? idMap[blk.groupId] : undefined;
      built.push({
        time: fmt(d),
        blockIndex: origIdx,
        slotStart: d,
        completed: comp,
      });
      if (origIdx !== undefined) {
        const c = counts[origIdx] || { total: 0, completed: 0 };
        c.total++;
        if (comp) c.completed++;
        counts[origIdx] = c;
      }
    }
    if (firstSleep) {
      const sleepBlockEnds = endTs + MS30 * 2;
      const sleepIdx = idMap[firstSleep.groupId!];
      for (
        let t = hhmmToDate(firstSleep.start).getTime();
        t < sleepBlockEnds;
        t += MS30
      ) {
        const d = new Date(t);
        const startKey = dateToHHMM(d);
        const comp = !!completion[startKey];
        built.push({
          time: fmt(d),
          blockIndex: sleepIdx,
          slotStart: d,
          completed: comp,
        });
        const c = counts[sleepIdx] || { total: 0, completed: 0 };
        c.total++;
        if (comp) c.completed++;
        counts[sleepIdx] = c;
      }
    }
    const updatedBlocks = blks.map((b, i) => ({
      ...b,
      total_slots: counts[i]?.total || 0,
      completed_slots: counts[i]?.completed || 0,
    }));
    return { slots: built, blocks: updatedBlocks };
  };

  // Initialize blocks and slots
  useEffect(() => {
    const received_blocks: Block[] = plan.blocks;
    const wakeUp = received_blocks.find(
      (b) => b.name.toLowerCase() === "wake up"
    );
    const wakeUpMinutes = wakeUp
      ? (() => {
          const [h, m] = wakeUp.start.replace("+1", "").split(":").map(Number);
          return h * 60 + m;
        })()
      : null;
    const addPlusIfNeeded = (time: string): string => {
      if (time.includes("+1")) return time;
      const [h, m] = time.split(":").map(Number);
      const mins = h * 60 + m;
      if (wakeUpMinutes) {
        return mins < wakeUpMinutes ? `${time}+1` : time;
      } else {
        return mins < 240 ? `${time}+1` : time;
      }
    };
    const init: Block[] = received_blocks.map((block) => ({
      ...block,
      start: addPlusIfNeeded(block.start),
      end: addPlusIfNeeded(block.end),
      groupId: block.groupId || uuid(),
    }));
    async function initSlots() {
      let comp: Record<string, boolean> = {};
      if (plan._id) {
        try {
          const res = await fetch(`${SERVER_URL}/slots/${plan._id}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            data.forEach((sl: any) => {
              comp[sl.start] = sl.completed;
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
      const built = buildSlots(init, comp);
      setBlocks(built.blocks);
      setSlots(built.slots);
      plan.blocks = built.blocks;
    }
    initSlots();
  }, [plan]);

  const [editing, setEditing] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const persistPlan = async (blocksToSave: Block[]) => {
    try {
      const cleanBlocks: Block[] = blocksToSave.map((b) => ({ ...b }));
      const payload = {
        date: plan.date,
        week_day: plan.week_day,
        timezone: plan.timezone,
        locale: plan.locale,
        blocks: cleanBlocks,
      } as const;

      await fetch(`${SERVER_URL}/dailyPlans/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to save daily plan", err);
    }
  };
  useEffect(() => {
    if (editing !== null) inputRef.current?.focus();
  }, [editing]);

  if (!blocks) {
    return <div>Did not receive blocks</div>;
  }

  const rebuildSlots = (nextBlocks: Block[]) => {
    const map: Record<string, boolean> = {};
    slots.forEach((s) => {
      map[dateToHHMM(s.slotStart)] = s.completed;
    });
    const built = buildSlots(nextBlocks, map);
    setSlots(built.slots);
    return built.blocks;
  };

  const splitBlock = (blks: Block[], idx: number, slotStart: Date): Block[] => {
    const blk = blks[idx];
    const st = hhmmToDate(blk.start),
      ed = hhmmToDate(blk.end);
    if (ed.getTime() - st.getTime() === MS30) return blks;
    const slotEnd = new Date(slotStart.getTime() + MS30);
    const frags: Block[] = [];
    if (st < slotStart)
      frags.push({
        ...blk,
        end: dateToHHMM(slotStart),
        groupId: blk.groupId,
      });
    frags.push({
      ...blk,
      start: dateToHHMM(slotStart),
      end: dateToHHMM(slotEnd, blk.end.includes("+1")),
      groupId: blk.groupId,
    });
    if (slotEnd < ed)
      frags.push({
        ...blk,
        start: dateToHHMM(slotEnd, blk.end.includes("+1")),
        end: blk.end,
        groupId: blk.groupId,
      });
    return [...blks.slice(0, idx), ...frags, ...blks.slice(idx + 1)];
  };

  const saveOne = (si: number) => {
    const sl = slots[si];
    if (sl.blockIndex === undefined || !inputRef.current) return;
    let next = splitBlock(blocks, sl.blockIndex, sl.slotStart);
    const startKey = dateToHHMM(sl.slotStart);
    const bi = next.findIndex((b) => b.start === startKey);
    const newName = inputRef.current.value.trim();
    const changed = newName && newName !== blocks[sl.blockIndex].name;
    next[bi] = {
      ...next[bi],
      name: newName || next[bi].name,
      groupId: changed ? uuid() : next[bi].groupId,
    };
    const rebuilt = rebuildSlots(next);
    setBlocks(rebuilt);
    persistPlan(rebuilt);
    setEditing(null);
  };

  const saveAll = (si: number) => {
    const sl = slots[si];
    if (sl.blockIndex === undefined || !inputRef.current) return;
    const gid = blocks[sl.blockIndex].groupId;
    const newName = inputRef.current.value.trim();
    const next = blocks.map((b) =>
      b.groupId === gid ? { ...b, name: newName || b.name } : b
    );
    const rebuilt = rebuildSlots(next);
    setBlocks(rebuilt);
    persistPlan(rebuilt);
    setEditing(null);
  };

  const toggleSlot = async (idx: number, checked: boolean) => {
    const sl = slots[idx];
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], completed: checked };
      return next;
    });
    if (sl.blockIndex !== undefined) {
      setBlocks((prev) => {
        const next = [...prev!];
        const b = next[sl.blockIndex];
        const newCompleted = Math.max(
          0,
          Math.min(
            (b.completed_slots || 0) + (checked ? 1 : -1),
            b.total_slots || 0
          )
        );
        next[sl.blockIndex] = { ...b, completed_slots: newCompleted };
        const planBlock = plan.blocks.find((pb) => pb.groupId === b.groupId);
        if (planBlock) planBlock.completed_slots = newCompleted;
        return next;
      });
    }
    try {
      const b =
        sl.blockIndex !== undefined ? blocks[sl.blockIndex] : undefined;
      await fetch(`${SERVER_URL}/slots/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dailyPlanId: plan._id,
          start: dateToHHMM(sl.slotStart),
          end: b?.end,
          name: b?.name,
          category: b?.category,
          completed: checked,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-900 rounded-xl p-4 space-y-2 text-gray-100">
      <h2 className="text-lg font-semibold mb-2 select-none">
        {parseInt(month)}/{parseInt(day)}/{year}
      </h2>
      {slots.map((s, i) => {
        const block = s.blockIndex !== undefined ? blocks[s.blockIndex] : null;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-400 select-none">
              {s.time}
            </div>
            <>
              <input
                type="checkbox"
                checked={s.completed}
                onChange={(e) => toggleSlot(i, e.target.checked)}
                className="mt-1"
              />
              {!block ? (
                <button className="flex-1 border border-dashed border-gray-600 rounded-md h-9 hover:ring-2 ring-white/40" />
              ) : (
                <div className="relative flex-1">
                  {editing === i ? (
                    <>
                      <textarea
                        ref={inputRef}
                        defaultValue={block.name}
                        rows={2}
                        className={`w-full rounded-md p-2 text-xs resize-none ${catBg[block.category]}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            saveOne(i);
                          }
                        }}
                      />
                      <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 flex flex-col gap-1">
                        <button
                          className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600"
                          title="Save this slot"
                          onClick={() => saveOne(i)}
                        >
                          <ArrowRight size={16} />
                        </button>
                        {block.groupId && block.groupId !== "" && (
                          <button
                            className="text-white p-1 bg-gray-700 rounded hover:bg-gray-600"
                            title="Save all slots of this block"
                            onClick={() => saveAll(i)}
                          >
                            <ArrowDown size={16} />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`w-full min-h-9 rounded-md px-2 py-1 text-xs flex items-center hover:ring-2 ring-white/40 ${catBg[block.category]} ${
                        s.completed ? "line-through" : ""
                      }`}
                    >
                      <span className="flex-1 text-left">{block.name}</span>
                      <button className="ml-2" onClick={() => setEditing(i)}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          </div>
        );
      })}
    </div>
  );
}

