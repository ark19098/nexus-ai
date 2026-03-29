"use client"

// modules/analytics/components/UsageChart.tsx
// Token usage over time — Recharts line chart

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface DayData {
  date:    string
  tokens:  number
  cost:    number
  queries: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function CustomTooltip({ active, payload, label }: {
  active?:  boolean
  payload?: { value: number; name: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-zinc-400 text-xs mb-2">{label ? formatDate(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-cyan-400 text-sm font-medium">
          {p.value.toLocaleString()} {p.name}
        </p>
      ))}
    </div>
  )
}

export default function UsageChart({ data }: { data: DayData[] }) {
  const hasData = data.some((d) => d.tokens > 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-sm">Token Usage</h3>
          <p className="text-zinc-600 text-xs mt-0.5">Last 30 days</p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-zinc-700 text-sm">No usage data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#52525b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="tokens"
              name="tokens"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#tokenGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#06b6d4" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}