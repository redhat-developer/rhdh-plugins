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
import type { MouseEvent } from 'react';

import { useTheme } from '@mui/material/styles';

import { CardWrapper } from '../../Common/CardWrapper';
import type { PieData } from '../../types';
import { resolveStatusColor } from '../../../utils';
import { ResponsivePieChart } from '../../ScorecardHomepageSection/ResponsivePieChart';
import { CardInfoButton } from '../components/CardInfoButton';
import { CardSubheader } from '../components/CardSubheader';
import { CardChartContainer } from '../components/CardChartContainer';
import { CardTooltip } from '../components/CardTooltip';
import { DonutChartTooltipContent } from './DonutChartTooltipContent';
import type { TooltipPosition } from '../types';
import type { WeightedStatusScoreCardComponentProps } from './types';
import { WeightedStatusScoreCardPieCenterLabel } from './WeightedStatusScoreCardPieCenterLabel';
import { formatPercentage } from '../../../utils/formatPercentage';

const WEIGHTED_STATUS_SCORE_SLICE = 'weightedStatusScoreFill';
const WEIGHTED_STATUS_SCORE_REMAINDER_SLICE = 'weightedStatusScoreRemainder';

function clampPercentForDonut(rawPercent: number): {
  fill: number;
  remainder: number;
} {
  const fill = Math.min(100, Math.max(0, rawPercent));
  return { fill, remainder: 100 - fill };
}

export const WeightedStatusScoreCardComponent = ({
  scorecard,
  cardTitle,
  description,
  aggregationId,
  showSubheader = true,
  showInfo = true,
  dataTestId,
}: WeightedStatusScoreCardComponentProps) => {
  const theme = useTheme();

  const [centerTooltipPosition, setCenterTooltipPosition] =
    useState<TooltipPosition | null>(null);

  const updateCenterTooltipPosition = (e: MouseEvent<SVGCircleElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCenterTooltipPosition({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
  };

  const weightedStatusScorePercent = scorecard.result.weightedStatusScore;

  const { fill: chartFillPercent, remainder: chartRemainderPercent } =
    clampPercentForDonut(weightedStatusScorePercent);

  const centerPercentLabel = `${formatPercentage(weightedStatusScorePercent)}%`;

  const arcResolvedColor = resolveStatusColor(
    theme,
    scorecard.result.aggregationChartDisplayColor,
  );

  const weightedStatusScorePieData: PieData[] = [
    {
      name: WEIGHTED_STATUS_SCORE_SLICE,
      value: chartFillPercent,
      color: arcResolvedColor,
    },
    {
      name: WEIGHTED_STATUS_SCORE_REMAINDER_SLICE,
      value: chartRemainderPercent,
      color: theme.palette.grey[300],
    },
  ];

  const subheader = showSubheader ? (
    <CardSubheader
      aggregationId={aggregationId}
      scorecardId={scorecard.id}
      entitiesCount={scorecard.result.total}
      entitiesConsidered={scorecard.result.entitiesConsidered}
      calculationErrorCount={scorecard.result.calculationErrorCount}
    />
  ) : null;

  const info = showInfo ? (
    <CardInfoButton timestamp={scorecard.result.timestamp} />
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
          pieData={weightedStatusScorePieData}
          LabelContent={props => (
            <WeightedStatusScoreCardPieCenterLabel
              {...props}
              centerPercentLabel={centerPercentLabel}
              arcResolvedColor={arcResolvedColor}
              updateCenterTooltipPosition={updateCenterTooltipPosition}
              setCenterTooltipPosition={setCenterTooltipPosition}
            />
          )}
        />

        {centerTooltipPosition && (
          <CardTooltip
            tooltipPosition={centerTooltipPosition}
            pieData={weightedStatusScorePieData}
            payload={[
              {
                name: WEIGHTED_STATUS_SCORE_SLICE,
                value: 1,
                payload: weightedStatusScorePieData[0],
              },
            ]}
            customContent={
              <DonutChartTooltipContent
                weightedSum={scorecard.result.weightedStatusSum}
                maxPossible={scorecard.result.weightedStatusMaxPossible}
                statusValues={scorecard.result.values}
              />
            }
          />
        )}
      </CardChartContainer>
    </CardWrapper>
  );
};
