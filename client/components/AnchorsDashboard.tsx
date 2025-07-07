import React, { useMemo, useState } from "react";
import {
  CalendarClock,
  Dumbbell,
  BookOpen,
  Briefcase,
  Sparkles,
} from "lucide-react";

// ---------- Types ---------------------------------------------------------
export interface Block {
  blockId: string;
  kind: "fixed" | "flexible" | "count" | "duration";
  days: string[];
  start?: string;
  end?: string;
  durationMinutes?: number;
  count?: number;
  frequencyPerWeek?: number;
  preferred?: string[];
  location?: string;
  details?: string;
  meta?: Record<string, unknown>;
}

export interface Anchor {
  id: string;
  label: string;
  category: "work" | "routine" | "hobby" | "goal" | "other";
  icon?: string;
  blocks: Block[];
}

// ---------- Helpers --------------------------------------------------------
const categoryColor: Record<Anchor["category"], string> = {
  work: "bg-blue-100 text-blue-800",
  routine: "bg-green-100 text-green-800",
  hobby: "bg-pink-100 text-pink-800",
  goal: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

const CategoryIcon: Record<Anchor["category"], React.ComponentType<any>> = {
  work: Briefcase,
  routine: Dumbbell,
  hobby: Sparkles,
  goal: BookOpen,
  other: CalendarClock,
};

function formatBlockCompact(block: Block) {
  switch (block.kind) {
    case "fixed":
      return `${block.start}–${block.end}`;
    case "flexible":
      return "flex";
    case "count":
      return `${block.count}×`;
    case "duration":
      return `${block.durationMinutes}m`;
    default:
      return "";
  }
}

// ---------- Minimal UI Primitives ----------------------------------------
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>
);

const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs mr-1 mb-1">
    {children}
  </span>
);


export const AnchorsDashboard: React.FC<{ anchors: Anchor[] }> = ({anchors}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return anchors;
    return anchors.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, anchors]);

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search…"
        className="w-full max-w-sm rounded-xl border p-2 text-sm text-white focus:ring-2 focus:ring-blue-400"
      />

      {/* Anchors list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-black">
        {filtered && filtered.map(anchor => (
          <Card key={anchor.id}>
            <details open className="p-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  {React.createElement(CategoryIcon[anchor.category], { className: "h-4 w-4" })}
                  <span className="font-medium text-sm">{anchor.label}</span>
                </div>
                <Badge className={`${categoryColor[anchor.category]} capitalize`}>{anchor.category}</Badge>
              </summary>

              {/* Blocks compact chips */}
              <div className="mt-3 flex flex-wrap">
                {anchor.blocks.map(b => (
                  <Chip key={b.blockId}>
                    {b.days.join("/")}: {formatBlockCompact(b)}
                    {b.location ? ` @ ${b.location}` : ""}
                  </Chip>
                ))}
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
};
