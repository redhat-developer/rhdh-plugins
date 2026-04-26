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

import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { PieData } from '../../types';
import {
  getThresholdRuleColor,
  SCORECARD_ERROR_STATE_COLOR,
  resolveStatusColor,
} from '../../../utils';
import { CardWrapper } from '../../Common/CardWrapper';
import { CardInfoButton } from '../components/CardInfoButton';
import { ResponsivePieChart } from '../../ScorecardHomepageSection/ResponsivePieChart';
import CustomLegend from '../../ScorecardHomepageSection/CustomLegend';
import { CustomTooltip } from '../../ScorecardHomepageSection/CustomTooltip';
import { CardChartContainer } from '../components/CardChartContainer';
import { CardSubheader } from '../components/CardSubheader';
import { CardTooltip } from '../components/CardTooltip';
import { StatusGroupedCardComponentProps } from './types';

export const StatusGroupedCardComponent = ({
  scorecard,
  cardTitle,
  description,
  aggregationId,
  showSubheader = true,
  showInfo = true,
  dataTestId,
}: StatusGroupedCardComponentProps) => {
  const theme = useTheme();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const { id: scorecardId, result } = scorecard;

  const pieData: PieData[] =
    result.values?.map(value => ({
      name: value.name,
      value: value.count,
      color: resolveStatusColor(
        theme,
        getThresholdRuleColor(result.thresholds.rules, value.name) ??
          SCORECARD_ERROR_STATE_COLOR,
      ),
    })) ?? [];

  const subheader = showSubheader ? (
    <CardSubheader
      aggregationId={aggregationId}
      scorecardId={scorecardId}
      entitiesCount={result.total}
    />
  ) : null;

  const info = showInfo ? (
    <CardInfoButton timestamp={result.timestamp} />
  ) : null;

  return (
    <CardWrapper
      title={cardTitle}
      dataTestId={dataTestId}
      subheader={subheader}
      description={description}
      info={info}
    >
      <CardChartContainer>
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
          tooltipContent={({ active, payload }) =>
            active && payload ? (
              <CustomTooltip payload={payload} pieData={pieData} />
            ) : null
          }
        />

        {activeIndex !== null && tooltipPosition && (
          <CardTooltip
            tooltipPosition={tooltipPosition}
            pieData={pieData}
            payload={[
              {
                name: pieData[activeIndex].name,
                value: pieData[activeIndex].value,
                payload: pieData[activeIndex],
              },
            ]}
          />
        )}
      </CardChartContainer>
    </CardWrapper>
  );
};
