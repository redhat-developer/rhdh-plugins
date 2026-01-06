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
import MuiTooltip from '@mui/material/Tooltip';
import { useTranslation } from '../../hooks/useTranslation';
import { CardWrapper } from '../Common/CardWrapper';
import CustomLegend from './CustomLegend';
import { getRingColor } from '../../utils/utils';

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

  const isErrorState = isMetricDataError || isThresholdError;

  const ringColor = getRingColor(theme, statusColor, isErrorState);

  const pieData = [{ name: 'full', value: 100, color: ringColor }];

  return (
    <CardWrapper title={cardTitle} description={description} width="371px">
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

                return (
                  <g transform={`translate(${cx}, ${cy})`}>
                    <foreignObject x={-12} y={-28} width={24} height={24}>
                      <StatusIcon
                        sx={{
                          fontSize: 24,
                          color: (muiTheme: any) =>
                            muiTheme.palette[statusColor.split('.')[0]][
                              statusColor.split('.')[1]
                            ],
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
                      <foreignObject x={-50} y={-17} width={100} height={40}>
                        <div
                          style={{
                            maxWidth: 100,
                            fontSize: 14,
                            fontWeight: 400,
                            color,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                          }}
                        >
                          {isMetricDataError &&
                            t('errors.metricDataUnavailable')}
                          {!isMetricDataError &&
                            isThresholdError &&
                            t('errors.invalidThresholds')}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
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
              position={{ x: 27, y: 136 }}
              isAnimationActive={false}
              content={({ active }) => {
                if (!active) return null;

                return (
                  <MuiTooltip
                    open
                    title={
                      // eslint-disable-next-line no-nested-ternary
                      isMetricDataError
                        ? metricDataError
                        : isThresholdError
                        ? thresholdError
                        : undefined
                    }
                    placement="bottom"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          cursor: isErrorState ? 'pointer' : 'default',
                        },
                      },
                    }}
                  >
                    {/* Need to hide the tooltip content because we are using the position prop to position the tooltip */}
                    <div style={{ visibility: 'hidden' }}>Tooltip content</div>
                  </MuiTooltip>
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
