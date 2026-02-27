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

import { useLayoutEffect, useRef, useState } from 'react';

import {
  MetricValue,
  ThresholdResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { useTranslation } from '../../hooks/useTranslation';
import { CardWrapper } from '../Common/CardWrapper';
import CustomLegend from './CustomLegend';
import {
  getHeightForCenterLabel,
  getRingColor,
  getYOffsetForCenterLabel,
} from '../../utils/utils';
import { ErrorTooltip } from '../Common/ErrorTooltip';

interface ScorecardProps {
  cardTitle: string;
  description: string;
  statusColor: string;
  StatusIcon: React.ElementType;
  value: MetricValue | null;
  thresholds?: ThresholdResult;
  isMetricDataError?: boolean;
  metricDataError?: string;
  isThresholdError?: boolean;
  thresholdError?: string;
}

const ScorecardCenterLabel = ({
  cx,
  cy,
  statusColor,
  StatusIcon,
  value,
  isErrorState,
  errorLabel,
  color,
  onLabelMouseEnter,
  onLabelMouseLeave,
}: {
  cx: number;
  cy: number;
  statusColor: string;
  StatusIcon: React.ElementType;
  value: MetricValue | null;
  isErrorState: boolean;
  errorLabel: string;
  color: string | undefined;
  onLabelMouseEnter: (e: React.MouseEvent) => void;
  onLabelMouseLeave: (e: React.MouseEvent) => void;
}) => {
  const fontSize = 14;
  const lineHeight = 1.2;

  const textRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ yOffset: -10, height: 40 });

  useLayoutEffect(() => {
    if (!isErrorState) return;
    const el = textRef.current;
    if (!el) return;

    const lineHeightPx = fontSize * lineHeight;
    const lineCount = Math.round(el.scrollHeight / lineHeightPx);

    const nextOffset = getYOffsetForCenterLabel(lineCount);
    const nextHeight = getHeightForCenterLabel(lineCount);

    setLayout(prev =>
      prev.yOffset === nextOffset && prev.height === nextHeight
        ? prev
        : { yOffset: nextOffset, height: nextHeight },
    );
  }, [isErrorState, errorLabel]);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <foreignObject x={-12} y={-28} width={24} height={24}>
        <StatusIcon
          sx={{
            fontSize: 24,
            color: (muiTheme: any) => {
              const [paletteKey, shade] = statusColor.split('.');
              return muiTheme.palette[paletteKey][shade];
            },
          }}
        />
      </foreignObject>
      {!isErrorState && (
        <text
          y={12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={24}
          fontWeight={500}
          fill={color}
        >
          {value}
        </text>
      )}
      {isErrorState && (
        <foreignObject
          x={-50}
          y={layout.yOffset}
          width={100}
          height={layout.height}
        >
          <div
            ref={textRef}
            style={{
              maxWidth: 100,
              fontSize,
              fontWeight: 400,
              color,
              textAlign: 'center',
              lineHeight,
              wordBreak: 'break-word',
              cursor: 'pointer',
            }}
            onMouseEnter={onLabelMouseEnter}
            onMouseLeave={onLabelMouseLeave}
          >
            {errorLabel}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

const Scorecard = ({
  cardTitle,
  description,
  statusColor,
  StatusIcon,
  value,
  thresholds,
  isMetricDataError = false,
  metricDataError,
  isThresholdError = false,
  thresholdError,
}: ScorecardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [isPieAreaActive, setIsPieAreaActive] = useState(false);

  const isErrorState = isMetricDataError || isThresholdError;

  const ringColor = getRingColor(theme, statusColor, isErrorState);

  const pieData = [{ name: 'full', value: 100, color: ringColor }];

  return (
    <CardWrapper
      role="article"
      title={cardTitle}
      description={description}
      width="371px"
    >
      <Box
        width="100%"
        height={160}
        data-chart-container
        position="relative"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'default',
          '& .recharts-wrapper > svg': {
            outline: 'none',
          },
        }}
      >
        <ResponsiveContainer
          width="100%"
          height={160}
          style={{
            outline: 'none',
          }}
        >
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            {/* This is the circle that is used to trigger the tooltip */}
            {isErrorState && (
              <g>
                <circle
                  cx="22%"
                  cy="50%"
                  r={74}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => {
                    setIsPieAreaActive(true);
                    e.stopPropagation();
                  }}
                  onMouseLeave={e => {
                    setIsPieAreaActive(false);
                    e.stopPropagation();
                  }}
                />
              </g>
            )}

            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="22%"
              cy="50%"
              innerRadius={64}
              outerRadius={74}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cursor={isErrorState ? 'pointer' : 'default'}
              isAnimationActive={false}
              style={{
                outline: 'none',
              }}
              labelLine={false}
              label={({ cx, cy }) => {
                if (cx === null || cy === null) return null;

                const palettePath = statusColor.split('.');
                let color: string | undefined;
                const paletteRoot =
                  theme.palette[palettePath[0] as keyof typeof theme.palette];
                if (palettePath.length === 1) {
                  color = paletteRoot as string | undefined;
                } else if (palettePath.length === 2) {
                  color = (paletteRoot as Record<string, any>)?.[
                    palettePath[1]
                  ] as string | undefined;
                } else if (palettePath.length === 3) {
                  color = (paletteRoot as Record<string, any>)?.[
                    palettePath[1]
                  ]?.[palettePath[2]] as string | undefined;
                }

                let errorLabel = '';
                if (isMetricDataError) {
                  errorLabel = t('errors.metricDataUnavailable');
                } else if (isThresholdError) {
                  errorLabel = t('errors.invalidThresholds');
                }

                return (
                  <ScorecardCenterLabel
                    cx={Number(cx)}
                    cy={Number(cy)}
                    statusColor={statusColor}
                    StatusIcon={StatusIcon}
                    value={value}
                    isErrorState={isErrorState}
                    errorLabel={errorLabel}
                    color={color}
                    onLabelMouseEnter={e => {
                      setIsPieAreaActive(true);
                      e.stopPropagation();
                    }}
                    onLabelMouseLeave={e => {
                      setIsPieAreaActive(false);
                      e.stopPropagation();
                    }}
                  />
                );
              }}
              onMouseEnter={() => {
                setIsPieAreaActive(true);
              }}
              onMouseLeave={() => {
                setIsPieAreaActive(false);
              }}
            >
              {pieData.map(entry => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Legend
              layout="vertical"
              align="center"
              verticalAlign="middle"
              wrapperStyle={{
                position: 'absolute',
                left: '160px',
                top: '42px',
                display: 'flex',
                alignItems: 'center',
                height: '76px',
              }}
              content={props => (
                <CustomLegend {...props} thresholds={thresholds} />
              )}
            />

            <Tooltip
              isAnimationActive={false}
              content={({ coordinate }) => {
                let errorTooltipTitle: string | undefined;
                if (isMetricDataError) {
                  errorTooltipTitle = metricDataError;
                } else if (isThresholdError) {
                  errorTooltipTitle = thresholdError;
                } else {
                  errorTooltipTitle = undefined;
                }

                if (!isPieAreaActive || coordinate === undefined) return null;
                return (
                  <ErrorTooltip
                    title={errorTooltipTitle}
                    tooltipPosition={{
                      x: coordinate.x - 25,
                      y: coordinate?.y - 16,
                    }}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </CardWrapper>
  );
};

export default Scorecard;
