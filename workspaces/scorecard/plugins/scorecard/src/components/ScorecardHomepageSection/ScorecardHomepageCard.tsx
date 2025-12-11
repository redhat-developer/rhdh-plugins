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

import { CardWrapper } from '../Common/CardWrapper';
import { CustomTooltip } from './CustomTooltip';
import CustomLegend from './CustomLegend';
import type { AggregatedMetricResult, PieData } from '../../utils/utils';

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

  const pieData: PieData[] =
    scorecard.result.values?.map(value => ({
      name: value.name,
      value: value.count,
      color:
        {
          success: theme.palette.success.main,
          warning: theme.palette.warning.main,
          error: theme.palette.error.main,
        }[value.name] || theme.palette.success.main,
    })) ?? [];

  return (
    <CardWrapper
      title={scorecard.metadata.title}
      subtitle={`${scorecard.result.total} entities`}
    >
      <Box sx={{ pb: 2 }}>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ fontSize: '1rem', fontWeight: 400 }}
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
              content={props => (
                <CustomTooltip payload={props.payload} pieData={pieData} />
              )}
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
              payload={[
                {
                  name: pieData[activeIndex].name,
                  value: pieData[activeIndex].value,
                  payload: pieData[activeIndex],
                },
              ]}
              pieData={pieData}
            />
          </Box>
        )}
      </Box>
    </CardWrapper>
  );
};
