import React from "react";

// Shows four gradient blocks (2×2) per "set".
// Pass a `setIndex` prop (0‑4) to switch among the five predefined sets.
// Example: <GradientPreview setIndex={2} />

export default function GradientPreview({ setIndex = 4 }) {
  const gradientSets = [
    [
      ["from-indigo-500", "to-emerald-500"],
      ["from-rose-400", "to-fuchsia-500"],
      ["from-sky-400", "to-cyan-500"],
      ["from-orange-400", "to-amber-500"],
    ],
    [
      ["from-purple-500", "to-pink-500"],
      ["from-teal-400", "to-lime-500"],
      ["from-violet-500", "to-purple-600"],
      ["from-red-500", "to-yellow-500"],
    ],
    [
      ["from-blue-500", "to-sky-500"],
      ["from-emerald-500", "to-lime-500"],
      ["from-amber-400", "to-orange-500"],
      ["from-fuchsia-500", "to-rose-400"],
    ],
    [
      ["from-cyan-500", "to-teal-500"],
      ["from-pink-500", "to-rose-500"],
      ["from-orange-500", "to-amber-500"],
      ["from-indigo-500", "to-violet-500"],
    ],
    [
      ["from-green-500", "to-emerald-500"],
      ["from-red-500", "to-rose-500"],
      ["from-purple-500", "to-indigo-500"],
      ["from-yellow-400", "to-amber-500"],
    ],
  ];

  const set = gradientSets[setIndex % gradientSets.length];

  return (
    <div className="flex flex-wrap min-h-screen">
      {set.map(([from, to], idx) => (
        <div
          key={idx}
          className={`w-1/2 h-120 bg-gradient-to-br ${from} ${to} flex items-center justify-center p-4`}
        >
          <span className="text-white font-semibold drop-shadow-md">
            {from.replace("from-", "")} → {to.replace("to-", "")}
          </span>
        </div>
      ))}
    </div>
  );
}
