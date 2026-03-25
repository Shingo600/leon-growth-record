"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GraphRange, GrowthRecord } from "@/lib/types";
import { getGraphData } from "@/lib/utils";

const ranges: GraphRange[] = ["1週間", "1か月", "全期間"];

export function WeightChart({ records }: { records: GrowthRecord[] }) {
  const [range, setRange] = useState<GraphRange>("1か月");
  const data = useMemo(() => getGraphData(records, range), [records, range]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">体重推移</h3>
          <p className="mt-1 text-sm text-ink/60">期間を切り替えて変化を見返せます</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ranges.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRange(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              range === item ? "bg-ink text-white" : "bg-cream text-ink/70"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              domain={["dataMin - 0.2", "dataMax + 0.2"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e7dccd",
                backgroundColor: "white"
              }}
            />
            <Line type="monotone" dataKey="weight" stroke="#c98b61" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
