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

import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { CardWrapper } from '../Common/CardWrapper';
import { CustomTooltip } from './CustomTooltip';
import CustomLegend from './CustomLegend';
import type { PieData } from '../../utils/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { ResponsivePieChart } from './ResponsivePieChart';

export const ScorecardHomepageCard = ({
  scorecard,
  cardTitle,
  description,
}: {
  scorecard: AggregatedMetricResult;
  cardTitle: string;
  description: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

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
      title={cardTitle}
      subheader={t('thresholds.entities', { count: scorecard.result.total })}
      description={description}
    >
      <Box
        width="100%"
        minWidth={311}
        minHeight={174}
        height="100%"
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
        <ResponsivePieChart
          pieData={pieData}
          legendContent={props => (
            <CustomLegend
              {...props}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              setTooltipPosition={setTooltipPosition}
              pieData={pieData}
            />
          )}
          tooltipContent={(props: any) => (
            <CustomTooltip payload={props?.payload} pieData={pieData} />
          )}
        />

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
