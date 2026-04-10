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

import { Link } from '@backstage/core-components';
import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { CardWrapper } from '../Common/CardWrapper';
import { CustomTooltip } from './CustomTooltip';
import CustomLegend from './CustomLegend';
import type { PieData } from '../types';
import {
  getThresholdRuleColor,
  resolveStatusColor,
  SCORECARD_ERROR_STATE_COLOR,
  getLastUpdatedLabel,
} from '../../utils';
import { useTranslation } from '../../hooks/useTranslation';
import { ResponsivePieChart } from './ResponsivePieChart';
import { useLanguage } from '../../hooks/useLanguage';

const InfoComponent = ({ timestamp }: { timestamp: string }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLanguage();

  const lastUpdatedLabel = getLastUpdatedLabel(timestamp, locale);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', mr: 2 }}>
      <Tooltip
        title={
          <Box sx={{ textAlign: 'center' }}>
            {lastUpdatedLabel !== '--'
              ? t('metric.lastUpdated' as any, { timestamp: lastUpdatedLabel })
              : t('metric.lastUpdatedNotAvailable')}
          </Box>
        }
        placement="top"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: '0.875rem',
              p: 1.5,
            },
          },
        }}
      >
        <IconButton>
          <InfoOutlinedIcon
            sx={{ color: theme.palette.text.secondary, fontSize: '1.75rem' }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export const ScorecardHomepageCardComponent = ({
  scorecard,
  cardTitle,
  description,
  showSubheader = true,
  showInfo = true,
}: {
  scorecard: AggregatedMetricResult;
  cardTitle: string;
  description: string;
  showSubheader?: boolean;
  showInfo?: boolean;
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
      color: resolveStatusColor(
        theme,
        getThresholdRuleColor(scorecard.result.thresholds.rules, value.name) ??
          SCORECARD_ERROR_STATE_COLOR,
      ),
    })) ?? [];

  return (
    <CardWrapper
      title={cardTitle}
      {...(showSubheader
        ? {
            subheader: (
              <Tooltip
                enterDelay={1500}
                title={t('metric.someEntitiesNotReportingValues')}
                arrow
                placement="right"
              >
                <Link to={`/scorecard/metrics/${scorecard.id}`}>
                  {t('thresholds.entities', { count: scorecard.result.total })}
                </Link>
              </Tooltip>
            ),
          }
        : {})}
      description={description}
      {...(showInfo
        ? {
            info: <InfoComponent timestamp={scorecard.result.timestamp} />,
          }
        : {})}
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
          tooltipContent={({ active, payload }) =>
            active && payload ? (
              <CustomTooltip payload={payload} pieData={pieData} />
            ) : null
          }
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
