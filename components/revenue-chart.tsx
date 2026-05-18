"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Project } from "@/lib/types";
import { formatCurrency, getRevenueSeries } from "@/lib/utils";

export function RevenueChart({ projects }: { projects: Project[] }) {
  const data = getRevenueSeries(projects);

  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Prihodki</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Zadnjih 6 mesecev</h2>
        </div>
        <div className="rounded-lg border border-line bg-white/60 px-3 py-2 text-right">
          <p className="text-xs text-muted">Plačani projekti</p>
          <p className="text-sm font-semibold text-ink">
            {formatCurrency(data.reduce((sum, item) => sum + item.prihodki, 0))}
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#a86f51" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#a86f51" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e0d0bd" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#776e63", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={54}
              tick={{ fill: "#776e63", fontSize: 12 }}
              tickFormatter={(value) => `${Number(value) / 1000}k`}
            />
            <Tooltip
              cursor={{ stroke: "#a86f51", strokeWidth: 1 }}
              formatter={(value) => [formatCurrency(Number(value)), "Prihodki"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e0d0bd",
                background: "#fffaf2",
                boxShadow: "0 8px 24px rgba(66, 47, 29, 0.08)"
              }}
            />
            <Area
              type="monotone"
              dataKey="prihodki"
              stroke="#a86f51"
              strokeWidth={3}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
