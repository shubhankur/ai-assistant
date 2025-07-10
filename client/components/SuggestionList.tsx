import React from "react";
import { Info } from "lucide-react";


/* ---------------- Types ---------------- */
export type Priority = "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LEAST";
export interface SuggestionPayload {
  HIGHEST?: string | string[];
  HIGH?: string | string[];
  MEDIUM?: string | string[];
  LOW?: string | string[];
  LEAST?: string | string[];
  changes?: {
    summary: string[];
  };
}

/* ------------- Styling Maps ------------- */
const order: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LEAST"];

const badgeColor: Record<Priority, string> = {
  HIGHEST: "bg-red-600",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-400 text-black",
  LOW: "bg-green-500",
  LEAST: "bg-gray-500"
};

const listMarker: Record<Priority, string> = {
  HIGHEST: "border-red-600",
  HIGH: "border-orange-500",
  MEDIUM: "border-yellow-400",
  LOW: "border-green-500",
  LEAST: "border-gray-500"
};

/* ------------- UI Primitives ------------ */
const Badge: React.FC<{ p: Priority }> = ({ p }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${badgeColor[p]}`}
  >
    {p}
  </span>
);

/* ------------- Component ---------------- */
interface SuggestionListProps {
  data?: SuggestionPayload;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({data}) => (
  <div className="p-6 bg-black min-h-screen">
    <h2 className="text-xl font-semibold text-white mb-4">Suggested Changes</h2>
    <div className="space-y-4 text-gray-200">
      {/* Change summary panel */}
      {data && data.changes?.summary?.length ? (
        <div className="bg-yellow-600/20 text-yellow-100 rounded-lg p-4 flex gap-3">
          <Info size={18} className="mt-0.5" />
          <ul className="list-disc list-inside text-sm space-y-1">
            {data.changes.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {/* Suggestions */}
            {data && order.map((p) => {
                const suggestion = data[p];
                if (!suggestion) return null;
                const items = Array.isArray(suggestion) ? suggestion : [suggestion];
                return (
                    <div key={p} className="flex gap-3 items-start">
                        {/* Colored vertical marker */}
                        <div className={`h-full w-1 rounded-sm ${listMarker[p]}`}></div>
                        <div className="flex-1 space-y-1">
                            <Badge p={p} />
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {items.map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
