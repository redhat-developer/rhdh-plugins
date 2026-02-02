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
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { CardWrapper } from '../Common/CardWrapper';
import { useTranslation } from '../../hooks/useTranslation';
import { getStatusConfig, getRingColor } from '../../utils/utils';
import CustomLegend from '../Scorecard/CustomLegend';
import { CustomTooltip } from './CustomTooltip';
import { ResponsivePieChart } from './ResponsivePieChart';

const CenterLabel = ({
  cx,
  cy,
  label,
  color,
}: {
  cx: number;
  cy: number;
  label: string;
  color?: string;
}) => {
  const fontSize = 14;
  const lineHeight = 1.2;

  const textRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ yOffset: -10, height: 40 });

  const getYOffset = (lineCount: number) => {
    switch (lineCount) {
      case 2:
        return -17;
      case 3:
        return -24;
      default:
        return -8;
    }
  };

  const getHeight = (lineCount: number) => {
    switch (lineCount) {
      case 2:
        return 48;
      case 3:
        return 56;
      default:
        return 40;
    }
  };

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const lineHeightPx = fontSize * lineHeight;
    const lineCount = Math.round(el.scrollHeight / lineHeightPx);

    const nextOffset = getYOffset(lineCount);
    const nextHeight = getHeight(lineCount);

    setLayout(prev =>
      prev.yOffset === nextOffset && prev.height === nextHeight
        ? prev
        : { yOffset: nextOffset, height: nextHeight },
    );
  }, [label]);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
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
          }}
        >
          {label}
        </div>
      </foreignObject>
    </g>
  );
};

export const EmptyStatePanel = ({
  label,
  metricId,
  tooltipContent,
}: {
  label: string;
  metricId: string;
  tooltipContent: string;
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
          LabelContent={({ cx, cy }) => {
            if (
              cx === null ||
              cy === null ||
              cx === undefined ||
              cy === undefined
            )
              return null;

            const centerX = Number(cx);
            const centerY = Number(cy);

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
              color = (paletteRoot as Record<string, any>)?.[palettePath[1]]?.[
                palettePath[2]
              ];
            }

            return (
              <CenterLabel
                cx={centerX}
                cy={centerY}
                label={label}
                color={color}
              />
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
              customContent={tooltipContent}
            />
          )}
        />
      </Box>
    </CardWrapper>
  );
};
