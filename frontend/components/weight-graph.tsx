"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeightLogEntry {
  date: Date;
  weight: number;
  bodyFatPercentage?: number;
  isActual: boolean;
}

interface WeightGraphProps {
  days?: number;
  targetWeight?: number;
}

export function WeightGraph({ days = 30, targetWeight }: WeightGraphProps) {
  const [weightData, setWeightData] = useState<WeightLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeightData();
  }, [days]);

  const fetchWeightData = async () => {
    try {
      const response = await fetch(`/api/weight-log?days=${days}`);
      const result = await response.json();
      
      if (result.success) {
        setWeightData(result.data);
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">Loading weight data...</div>
        </CardContent>
      </Card>
    );
  }

  if (weightData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
          <CardDescription>No weight data available yet</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">
            Start logging your weight to see your progress over time
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const weights = weightData.map(d => d.weight);
  const currentWeight = weights[weights.length - 1];
  const startWeight = weights[0];
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = ((weightChange / startWeight) * 100).toFixed(1);

  // Calculate chart dimensions
  const padding = 40;
  const chartWidth = 800;
  const chartHeight = 200;
  const dataMin = Math.floor(minWeight - 2);
  const dataMax = Math.ceil(maxWeight + 2);
  const range = dataMax - dataMin;

  // Generate SVG path for the weight line
  const points = weightData.map((entry, index) => {
    const x = weightData.length > 1 
      ? padding + (index / (weightData.length - 1)) * (chartWidth - padding * 2)
      : chartWidth / 2; // Center single point
    const y = chartHeight - padding - ((entry.weight - dataMin) / range) * (chartHeight - padding * 2);
    return { x, y, ...entry };
  });

  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  // Create area path for gradient fill
  const areaPath = `${linePath} L ${points[points.length - 1].x},${chartHeight - padding} L ${points[0].x},${chartHeight - padding} Z`;

  // Generate target weight line if provided
  let targetLinePath = '';
  if (targetWeight && targetWeight >= dataMin && targetWeight <= dataMax) {
    const targetY = chartHeight - padding - ((targetWeight - dataMin) / range) * (chartHeight - padding * 2);
    targetLinePath = `M ${padding},${targetY} L ${chartWidth - padding},${targetY}`;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              Weight Progress
              {weightChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : weightChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <Minus className="h-5 w-5 text-gray-500" />
              )}
            </CardTitle>
            <CardDescription>Last {days} days</CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Change</div>
              <div className={`font-bold ${weightChange > 0 ? 'text-red-500' : weightChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
              <div className="text-xs text-muted-foreground">
                ({weightChange > 0 ? '+' : ''}{weightChangePercent}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className="font-bold text-lg">{currentWeight.toFixed(1)} kg</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-auto"
            style={{ minHeight: '200px' }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="weightGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padding + (i / 4) * (chartHeight - padding * 2);
              const weight = dataMax - (i / 4) * range;
              return (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.5"
                  >
                    {weight.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Target weight line */}
            {targetLinePath && (
              <g>
                <path
                  d={targetLinePath}
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  opacity="0.5"
                />
                <text
                  x={chartWidth - padding - 5}
                  y={chartHeight - padding - ((targetWeight! - dataMin) / range) * (chartHeight - padding * 2) - 5}
                  textAnchor="end"
                  fontSize="10"
                  fill="rgb(34, 197, 94)"
                  fontWeight="bold"
                >
                  Target: {targetWeight!.toFixed(1)} kg
                </text>
              </g>
            )}

            {/* Area under the line */}
            <path
              d={areaPath}
              fill="url(#weightGradient)"
            />

            {/* Weight line */}
            <path
              d={linePath}
              stroke="rgb(139, 92, 246)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.isActual ? 4 : 2}
                  fill={point.isActual ? 'rgb(139, 92, 246)' : 'rgb(139, 92, 246)'}
                  fillOpacity={point.isActual ? 1 : 0.3}
                  stroke="white"
                  strokeWidth={point.isActual ? 2 : 0}
                />
                {/* Show weight on hover */}
                <title>
                  {new Date(point.date).toLocaleDateString()}: {point.weight.toFixed(1)} kg
                  {!point.isActual && ' (estimated)'}
                </title>
              </g>
            ))}

            {/* X-axis labels (show some dates) */}
            {points.length > 0 && (() => {
              // Create unique indices for labels
              const indices = [0, Math.floor(points.length / 2), points.length - 1];
              const uniqueIndices = [...new Set(indices)].filter(i => i < points.length && points[i]);
              
              return uniqueIndices.map((i) => {
                const point = points[i];
                if (!point || isNaN(point.x)) return null;
                return (
                  <text
                    key={`label-${i}`}
                    x={point.x}
                    y={chartHeight - padding + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.5"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              });
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Actual measurement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 opacity-30"></div>
            <span>Estimated (previous day)</span>
          </div>
          {targetWeight && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-500 opacity-50"></div>
              <span>Target weight</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
