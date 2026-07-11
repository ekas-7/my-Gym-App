"use client";

import { useEffect, useState } from 'react';
import { IconTrendingUp, IconTrendingDown, IconMinus, IconSpinner, IconScale } from '@/components/icons';
import { getWeightLogs } from '@/lib/firestore';

interface WeightLogEntry {
  date: Date;
  weight: number;
  bodyFatPercentage?: number;
  isActual: boolean;
}

interface WeightGraphProps {
  uid: string;
  days?: number;
  targetWeight?: number;
  /** bump to force a refetch (e.g. after saving a new measurement) */
  refreshKey?: number;
}

export function WeightGraph({ uid, days = 30, targetWeight, refreshKey = 0 }: WeightGraphProps) {
  const [weightData, setWeightData] = useState<WeightLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const logs = await getWeightLogs(uid, days);
        const logMap = new Map(
          logs.map((log) => [new Date(log.date).toISOString().split('T')[0], log])
        );

        const filled: WeightLogEntry[] = [];
        let lastWeight: number | null = null;
        let lastBodyFat: number | null = null;

        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          d.setHours(0, 0, 0, 0);
          const key = d.toISOString().split('T')[0];
          const existing = logMap.get(key);
          if (existing) {
            lastWeight = existing.weight;
            lastBodyFat = existing.bodyFatPercentage ?? null;
            filled.push({ date: d, weight: existing.weight, bodyFatPercentage: existing.bodyFatPercentage, isActual: true });
          } else if (lastWeight !== null) {
            filled.push({ date: d, weight: lastWeight, bodyFatPercentage: lastBodyFat ?? undefined, isActual: false });
          }
        }
        if (!cancelled) setWeightData(filled);
      } catch (error) {
        console.error('Error fetching weight data:', error);
        if (!cancelled) setWeightData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid, days, refreshKey]);

  const CYAN = 'var(--chart-1)';
  const GREEN = 'var(--chart-2)';

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-8 text-center flex flex-col items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
        <IconSpinner size={20} className="animate-spin" style={{ color: CYAN }} />
        <span className="font-body text-sm">Loading weight history…</span>
      </div>
    );
  }

  if (weightData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center space-y-2">
        <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--chart-1) 12%, transparent)' }}>
          <IconScale size={20} style={{ color: CYAN }} />
        </div>
        <p className="font-headline text-sm" style={{ color: 'var(--foreground)' }}>No weight data yet</p>
        <p className="font-body text-xs" style={{ color: 'var(--muted-foreground)' }}>Log your weight below to start tracking your progress.</p>
      </div>
    );
  }

  const weights = weightData.map((d) => d.weight);
  const currentWeight = weights[weights.length - 1];
  const startWeight = weights[0];
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = startWeight ? ((weightChange / startWeight) * 100).toFixed(1) : '0.0';

  const padding = 34;
  const chartWidth = 800;
  const chartHeight = 220;
  // guard against a flat line (all equal) producing range 0
  const spread = maxWeight - minWeight;
  const dataMin = Math.floor(minWeight - (spread < 1 ? 2 : 2));
  const dataMax = Math.ceil(maxWeight + (spread < 1 ? 2 : 2));
  const range = Math.max(dataMax - dataMin, 1);

  const points = weightData.map((entry, index) => {
    const x = weightData.length > 1
      ? padding + (index / (weightData.length - 1)) * (chartWidth - padding * 2)
      : chartWidth / 2;
    const y = chartHeight - padding - ((entry.weight - dataMin) / range) * (chartHeight - padding * 2);
    return { x, y, ...entry };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${chartHeight - padding} L ${points[0].x},${chartHeight - padding} Z`;

  let targetLinePath = '';
  let targetY = 0;
  if (targetWeight && targetWeight >= dataMin && targetWeight <= dataMax) {
    targetY = chartHeight - padding - ((targetWeight - dataMin) / range) * (chartHeight - padding * 2);
    targetLinePath = `M ${padding},${targetY} L ${chartWidth - padding},${targetY}`;
  }

  const changeColor = weightChange > 0 ? 'var(--chart-3)' : weightChange < 0 ? 'var(--chart-2)' : 'var(--muted-foreground)';

  return (
    <div className="glass-card rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-headline text-sm flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
            Weight Progress
            {weightChange > 0 ? <IconTrendingUp size={16} style={{ color: 'var(--chart-3)' }} />
              : weightChange < 0 ? <IconTrendingDown size={16} style={{ color: 'var(--chart-2)' }} />
              : <IconMinus size={16} style={{ color: 'var(--muted-foreground)' }} />}
          </h3>
          <p className="font-label text-[11px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Last {days} days</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Change</div>
            <div className="font-display text-base" style={{ color: changeColor }}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}<span className="text-[11px] font-headline"> kg</span>
            </div>
            <div className="font-label text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {weightChange > 0 ? '+' : ''}{weightChangePercent}%
            </div>
          </div>
          <div>
            <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Current</div>
            <div className="font-display text-base" style={{ color: CYAN }}>{currentWeight.toFixed(1)}<span className="text-[11px] font-headline"> kg</span></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" style={{ color: 'var(--foreground)' }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding + (i / 4) * (chartHeight - padding * 2);
          const weight = dataMax - (i / 4) * range;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
              <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.4">{weight.toFixed(0)}</text>
            </g>
          );
        })}

        {targetLinePath && (
          <g>
            <path d={targetLinePath} stroke={GREEN} strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.6" />
            <text x={chartWidth - padding - 4} y={targetY - 6} textAnchor="end" fontSize="11" fill={GREEN} fontWeight="700">
              Target {targetWeight!.toFixed(1)}kg
            </text>
          </g>
        )}

        <path d={areaPath} fill="url(#weightGradient)" />
        <path d={linePath} stroke="var(--chart-1)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--chart-1) 45%, transparent))' }} />

        {points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r={point.isActual ? 4.5 : 2} fill="var(--chart-1)"
              fillOpacity={point.isActual ? 1 : 0.35} stroke="var(--card)" strokeWidth={point.isActual ? 2 : 0} />
            <title>{new Date(point.date).toLocaleDateString()}: {point.weight.toFixed(1)} kg{!point.isActual && ' (estimated)'}</title>
          </g>
        ))}

        {points.length > 0 && (() => {
          const indices = [0, Math.floor(points.length / 2), points.length - 1];
          return [...new Set(indices)].filter((i) => i < points.length && points[i]).map((i) => {
            const point = points[i];
            if (!point || isNaN(point.x)) return null;
            return (
              <text key={`label-${i}`} x={point.x} y={chartHeight - padding + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.4">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          });
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CYAN }} />
          <span className="font-label text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CYAN, opacity: 0.35 }} />
          <span className="font-label text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Estimated</span>
        </div>
        {targetWeight && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5" style={{ background: GREEN, opacity: 0.6 }} />
            <span className="font-label text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Target</span>
          </div>
        )}
      </div>
    </div>
  );
}
