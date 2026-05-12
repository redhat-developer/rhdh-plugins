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
import {
  getThresholdRuleColor,
  resolveStatusColor,
  SCORECARD_ERROR_STATE_COLOR,
} from '../../../utils';
import { ResponsivePieChart } from '../../ScorecardHomepageSection/ResponsivePieChart';
import { CardInfoButton } from '../components/CardInfoButton';
import { CardSubheader } from '../components/CardSubheader';
import { CardChartContainer } from '../components/CardChartContainer';
import { CardTooltip } from '../components/CardTooltip';
import { LegendTooltipContent } from './LegendTooltipContent';
import { DonutChartTooltipContent } from './DonutChartTooltipContent';
import type { AverageCardComponentProps, TooltipPosition } from './types';
import { CardLegendContent } from '../components/CardLegendContent';
import { AverageCardPieCenterLabel } from './AverageCardPieCenterLabel';
import { formatPercentage } from '../../../utils/formatPercentage';

const AVERAGE_SCORE_SLICE = 'averageScoreFill';
const AVERAGE_REMAINDER_SLICE = 'averageScoreRemainder';

function clampPercentForDonut(rawPercent: number): {
  fill: number;
  remainder: number;
} {
  const fill = Math.min(100, Math.max(0, rawPercent));
  return { fill, remainder: 100 - fill };
}

export const AverageCardComponent = ({
  scorecard,
  cardTitle,
  description,
  aggregationId,
  showSubheader = true,
  showInfo = true,
  dataTestId,
}: AverageCardComponentProps) => {
  const theme = useTheme();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const [centerTooltipPosition, setCenterTooltipPosition] =
    useState<TooltipPosition | null>(null);

  const updateCenterTooltipPosition = (e: MouseEvent<SVGCircleElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCenterTooltipPosition({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
  };

  const averageScorePercent = scorecard.result.averageScore;

  const { fill: chartFillPercent, remainder: chartRemainderPercent } =
    clampPercentForDonut(averageScorePercent);

  const centerPercentLabel = `${formatPercentage(averageScorePercent)}%`;

  const arcResolvedColor = resolveStatusColor(
    theme,
    scorecard.result.aggregationChartDisplayColor,
  );

  const averagePieData: PieData[] = [
    {
      name: AVERAGE_SCORE_SLICE,
      value: chartFillPercent,
      color: arcResolvedColor,
    },
    {
      name: AVERAGE_REMAINDER_SLICE,
      value: chartRemainderPercent,
      color: theme.palette.grey[300],
    },
  ];

  const statusPieData: PieData[] =
    scorecard.result.values?.map(value => ({
      name: value.name,
      value: value.count,
      score: value.score,
      color: resolveStatusColor(
        theme,
        getThresholdRuleColor(scorecard.result.thresholds.rules, value.name) ??
          SCORECARD_ERROR_STATE_COLOR,
      ),
    })) ?? [];

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
          pieData={averagePieData}
          LabelContent={props => (
            <AverageCardPieCenterLabel
              {...props}
              centerPercentLabel={centerPercentLabel}
              arcResolvedColor={arcResolvedColor}
              setActiveIndex={setActiveIndex}
              setTooltipPosition={setTooltipPosition}
              updateCenterTooltipPosition={updateCenterTooltipPosition}
              setCenterTooltipPosition={setCenterTooltipPosition}
            />
          )}
          legendContent={props => (
            <CardLegendContent
              {...props}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              setTooltipPosition={setTooltipPosition}
              pieData={statusPieData}
            />
          )}
        />

        {centerTooltipPosition && (
          <CardTooltip
            tooltipPosition={centerTooltipPosition}
            pieData={averagePieData}
            payload={[
              {
                name: AVERAGE_SCORE_SLICE,
                value: 1,
                payload: averagePieData[0],
              },
            ]}
            customContent={
              <DonutChartTooltipContent
                weightedSum={scorecard.result.averageWeightedSum}
                maxPossible={scorecard.result.averageMaxPossible}
              />
            }
          />
        )}

        {activeIndex !== null &&
          tooltipPosition &&
          statusPieData[activeIndex] && (
            <CardTooltip
              tooltipPosition={tooltipPosition}
              pieData={statusPieData}
              payload={[
                {
                  name: statusPieData[activeIndex].name,
                  value: statusPieData[activeIndex].value || 1,
                  payload: statusPieData[activeIndex],
                },
              ]}
              customContent={
                <LegendTooltipContent
                  row={statusPieData[activeIndex]}
                  maxPossible={scorecard.result.averageMaxPossible}
                />
              }
            />
          )}
      </CardChartContainer>
    </CardWrapper>
  );
};
