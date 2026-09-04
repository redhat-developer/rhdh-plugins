/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useId, useState } from 'react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import {
  getSparklineYDomain,
  type SparklineChartPoint,
} from '../../utils/timeSeriesChartData';
import type { SparklineLegendItem } from '../../utils/sparklineLegend';
import { SparklineLegend } from './SparklineLegend';
import { SparklineTooltip } from './SparklineTooltip';

const PLOT_HEIGHT = 90;
const X_AXIS_HEIGHT = 30;

const TOOLTIP_WRAPPER_STYLE = {
  outline: 'none',
  pointerEvents: 'none',
  position: 'relative',
  transform: 'none',
  width: '100%',
  left: 0,
  top: 0,
} as const;

export type SparklineChartProps = {
  data: SparklineChartPoint[];
  color: string;
  unit?: string;
  testId?: string;
  strokeDasharray?: string;
  legendItems?: SparklineLegendItem[];
  legendTestId?: string;
};

export const SparklineChart = ({
  data,
  color,
  unit,
  testId,
  strokeDasharray,
  legendItems,
  legendTestId,
}: SparklineChartProps) => {
  const gradientId = `sparklineGradient${useId().replace(/:/g, '')}`;
  const [tooltipPortal, setTooltipPortal] = useState<HTMLDivElement | null>(
    null,
  );
  const theme = useTheme();
  const errorColor = theme.palette.error.main;
  const axisTickColor = theme.palette.text.secondary;
  const markerStroke = theme.palette.background.paper;
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const xTicks: string[] = [];
  if (firstPoint) {
    xTicks.push(firstPoint.date);
  }
  if (lastPoint && lastPoint.date !== firstPoint?.date) {
    xTicks.push(lastPoint.date);
  }
  const yDomain = getSparklineYDomain(data);

  return (
    <Box
      width="100%"
      data-chart-container
      data-testid={testId}
      position="relative"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        '& .recharts-wrapper > svg': {
          outline: 'none',
        },
      }}
    >
      <Box
        width="100%"
        height={PLOT_HEIGHT}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 4,
              right: 16,
              bottom: 0,
              left: 16,
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} horizontal={false} />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              height={X_AXIS_HEIGHT}
              interval={0}
              minTickGap={0}
              ticks={xTicks}
              tick={({ x, y, payload }) => {
                const isFirst = payload.value === firstPoint?.date;
                const isLast = payload.value === lastPoint?.date;

                if (!isFirst && !isLast) {
                  return <g />;
                }

                const point = data.find(d => d.date === payload.value);
                const label = point?.dateLabel ?? payload.value;

                if (xTicks.length <= 1) {
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={12}
                      textAnchor="middle"
                      fill={axisTickColor}
                      fontSize={14}
                    >
                      {label}
                    </text>
                  );
                }

                return (
                  <text
                    x={x}
                    y={y}
                    dy={12}
                    textAnchor={isFirst ? 'start' : 'end'}
                    fill={axisTickColor}
                    fontSize={14}
                  >
                    {label}
                  </text>
                );
              }}
              padding={{
                left: 0,
                right: 0,
              }}
            />

            <YAxis hide domain={yDomain} />

            <Tooltip
              content={<SparklineTooltip unit={unit} />}
              cursor={false}
              isAnimationActive={false}
              portal={tooltipPortal ?? undefined}
              wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            />

            <Area
              type="monotone"
              dataKey="plotValue"
              stroke={color}
              strokeWidth={3}
              strokeDasharray={strokeDasharray}
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              isAnimationActive={false}
              activeDot={({ cx, cy, payload }) => {
                const point = payload as SparklineChartPoint | undefined;
                if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
                  return <g />;
                }

                const isError = Boolean(point?.error);
                const hoverStroke = isError ? errorColor : color;

                return (
                  <g>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx}
                      y2={PLOT_HEIGHT - X_AXIS_HEIGHT}
                      stroke={hoverStroke}
                      strokeWidth={1}
                      strokeDasharray="4 3"
                      pointerEvents="none"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={hoverStroke}
                      stroke={markerStroke}
                      strokeWidth={2}
                    />
                  </g>
                );
              }}
              dot={props => {
                const { cx, cy, index, payload } = props;
                const point = payload as SparklineChartPoint | undefined;

                if (point?.error) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={errorColor}
                      stroke={markerStroke}
                      strokeWidth={2}
                    />
                  );
                }

                if (index !== data.length - 1) {
                  return <g />;
                }

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={color}
                    stroke={markerStroke}
                    strokeWidth={2}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      <Box
        ref={setTooltipPortal}
        data-testid="sparkline-tooltip-slot"
        sx={{
          width: '100%',
          px: 2,
          minHeight: '2rem',
          boxSizing: 'border-box',
        }}
      />
      {legendItems && legendItems.length > 0 && (
        <SparklineLegend items={legendItems} testId={legendTestId} />
      )}
    </Box>
  );
};
