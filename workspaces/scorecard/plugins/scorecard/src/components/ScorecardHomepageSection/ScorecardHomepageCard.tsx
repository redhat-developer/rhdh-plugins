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

import { useState } from 'react';

import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { CardWrapper } from './CardWrapper';
import { CustomTooltip } from './CustomTooltip';
import CustomLegend from './CustomLegend';
import { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const getTotalEntities = (scorecard: AggregatedMetricResult) => {
  if (
    !scorecard.result.value ||
    Object.keys(scorecard.result.value || {}).length === 0
  ) {
    return 0;
  }
  return Object.values(scorecard.result.value).reduce(
    (acc: number, curr: { value: number }) => acc + curr.value,
    0,
  );
};

export const ScorecardHomepageCard = ({
  scorecard,
}: {
  scorecard: AggregatedMetricResult;
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const pieData = Object.entries(scorecard.result.value ?? {}).map(
    ([key, val]) => {
      const value = (val as { value: number }).value;
      return {
        name: key,
        value,
        color:
          {
            success: theme.palette.success.main,
            warning: theme.palette.warning.main,
            error: theme.palette.error.main,
          }[key as 'success' | 'warning' | 'error'] ||
          theme.palette.success.main,
      };
    },
  );

  return (
    <CardWrapper
      title={scorecard.metadata.title}
      subtitle={`${getTotalEntities(scorecard)} entities`}
    >
      <Box sx={{ pb: 2 }}>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ fontSize: '16px' }}
        >
          {scorecard.metadata.description}
        </Typography>
      </Box>

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
        }}
      >
        <ResponsiveContainer
          width="100%"
          height={160}
          style={{
            outline: 'none',
          }}
        >
          <style>
            {`
              .recharts-wrapper > svg {
                outline: none;
              }
            `}
          </style>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="22%"
              cy="50%"
              innerRadius={65}
              outerRadius={74}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cursor="pointer"
              isAnimationActive={false}
              style={{
                outline: 'none',
              }}
            >
              {pieData.map(category => (
                <Cell key={category.name} fill={category.color} />
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
              }}
              content={props => (
                <CustomLegend
                  {...props}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  setTooltipPosition={setTooltipPosition}
                  pieData={pieData}
                />
              )}
            />

            <Tooltip
              content={props => <CustomTooltip {...props} pieData={pieData} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {activeIndex !== null && tooltipPosition && (
          <Box
            sx={{
              position: 'absolute',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <CustomTooltip
              {...({
                active: true,
                payload: [
                  {
                    name: pieData[activeIndex].name,
                    value: pieData[activeIndex].value,
                    payload: pieData[activeIndex],
                  },
                ],
                pieData,
              } as any)}
            />
          </Box>
        )}
      </Box>
    </CardWrapper>
  );
};
