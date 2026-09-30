import React from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, description, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

interface LineChartProps {
  values: number[];
  labels: string[];
  height?: number;
}

/** Minimal inline SVG line chart — no charting library dependency, matches the project's existing pattern of plain CSS/SVG visuals (see TopicPerformance bars). */
export const LineChart: React.FC<LineChartProps> = ({ values, labels, height = 140 }) => {
  const width = 560;
  const padding = 8;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <path d={areaPath} fill="rgba(220, 38, 38, 0.06)" />
        <path d={path} fill="none" stroke="rgb(185, 28, 28)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="rgb(185, 28, 28)" />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5 px-0.5">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-slate-400">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 140 }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="w-full rounded-t-sm bg-red-600/85" style={{ height: `${Math.max((d.value / max) * 100, 3)}%` }} title={`${d.label}: ${d.value}`} />
          <span className="text-[10px] text-slate-400 mt-1.5">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

interface HorizontalBarsProps {
  data: { label: string; value: number }[];
}

export const HorizontalBars: React.FC<HorizontalBarsProps> = ({ data }) => (
  <div className="space-y-2.5">
    {data.map((d) => (
      <div key={d.label} className="flex items-center gap-3">
        <span className="text-xs text-slate-700 w-40 flex-shrink-0 truncate">{d.label}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-red-600 rounded-full" style={{ width: `${d.value}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-600 w-10 text-right">{d.value}%</span>
      </div>
    ))}
  </div>
);
