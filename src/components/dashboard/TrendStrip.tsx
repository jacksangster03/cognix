"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  ReferenceLine,
} from "recharts"

interface TrendPoint {
  date: string
  value: number
}

interface TrendStripProps {
  data: TrendPoint[]
  label: string
  colour?: string
  referenceValue?: number
}

export function TrendStrip({
  data,
  label,
  colour = "#34d399",
  referenceValue,
}: TrendStripProps) {
  if (data.length < 2) {
    return (
      <div className="h-12 flex items-center">
        <span className="text-xs text-zinc-600">Not enough data yet</span>
      </div>
    )
  }

  return (
    <div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="h-12 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {referenceValue !== undefined && (
              <ReferenceLine
                y={referenceValue}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="3 3"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={colour}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 6,
                fontSize: 11,
                padding: "4px 8px",
              }}
              labelStyle={{ color: "#71717a", fontSize: 10 }}
              itemStyle={{ color: colour }}
              formatter={(v) => [v ?? "", label]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
