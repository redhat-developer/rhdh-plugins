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

import { ResponseErrorPanel } from '@backstage/core-components';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { CardWrapper } from '../Common/CardWrapper';
import { useTranslation } from '../../hooks/useTranslation';
import { getStatusConfig, getRingColor } from '../../utils/utils';
import CustomLegend from '../Scorecard/CustomLegend';
import { CustomTooltip } from './CustomTooltip';
import { ResponsivePieChart } from './ResponsivePieChart';

export const EmptyStatePanel = ({
  error,
  metricId,
}: {
  error: Error;
  metricId: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const titleKey = `metric.${metricId}.title`;
  const descriptionKey = `metric.${metricId}.description`;

  const cardTitle = t(titleKey as any, {});
  const cardDescription = t(descriptionKey as any, {});

  const statusConfig = getStatusConfig({
    evaluation: 'error',
    thresholdStatus: 'error',
  });

  const ringColor = getRingColor(theme, statusConfig.color, true);

  const pieData = [{ name: 'full', value: 100, color: ringColor }];

  const isMissingPermission = error.message?.includes('NotAllowedError');

  const isUserNotFoundInCatalog =
    error.message?.includes('NotFoundError') &&
    error.message?.includes('User entity not found in catalog');

  if (isMissingPermission || isUserNotFoundInCatalog) {
    return (
      <CardWrapper
        title={cardTitle}
        description={cardDescription}
        subheader={t('thresholds.entities', { count: 0 })}
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
            isMissingPermission={isMissingPermission}
            LabelContent={({ cx, cy }) => {
              if (cx === null || cy === null) return null;

              const palettePath = statusConfig.color.split('.');
              let color: string | undefined;
              const paletteRoot =
                theme.palette[palettePath[0] as keyof typeof theme.palette];
              if (palettePath.length === 1) {
                color = paletteRoot as string | undefined;
              } else if (palettePath.length === 2) {
                color = (paletteRoot as Record<string, string>)?.[
                  palettePath[1]
                ] as string | undefined;
              } else if (palettePath.length === 3) {
                color = (paletteRoot as Record<string, any>)?.[
                  palettePath[1]
                ]?.[palettePath[2]];
              }

              return (
                <g transform={`translate(${cx}, ${cy})`}>
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
                      {isMissingPermission
                        ? t('errors.missingPermission')
                        : null}
                    </div>
                  </foreignObject>
                </g>
              );
            }}
            legendContent={props => (
              <CustomLegend {...props} thresholds={undefined} />
            )}
            tooltipContent={props => (
              <CustomTooltip
                {...props}
                payload={undefined}
                pieData={pieData}
                isMissingPermission={isMissingPermission}
                isUserNotFoundInCatalog={isUserNotFoundInCatalog}
              />
            )}
          />
        </Box>
      </CardWrapper>
    );
  }

  return <ResponseErrorPanel error={error} />;
};
