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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import type { PieData as PieDataProps } from '../../utils/utils';

const StyledLegend = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(3.2),
}));

const StyledLegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
}));

const StyledLegendColorBox = styled(Box)<{ color: string }>(({ color }) => ({
  width: '10px',
  height: '10px',
  backgroundColor: color,
  flexShrink: 0,
}));

type CustomLegendProps = {
  pieData: PieDataProps[];
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  setTooltipPosition: (position: { x: number; y: number } | null) => void;
};

const CustomLegend = (props: CustomLegendProps) => {
  const { pieData, activeIndex, setActiveIndex, setTooltipPosition } = props;
  if (!pieData || pieData.length === 0) return null;

  return (
    <StyledLegend
      onMouseLeave={() => {
        setActiveIndex(null);
        setTooltipPosition(null);
      }}
    >
      {pieData.map((category: PieDataProps, index: number) => {
        return (
          <StyledLegendItem
            key={`legend-${category.name}`}
            onMouseEnter={e => {
              if (activeIndex === index) return;
              setActiveIndex(index);
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = e.currentTarget
                .closest('[data-chart-container]')
                ?.getBoundingClientRect();
              if (containerRect) {
                setTooltipPosition({
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top,
                });
              }
            }}
            onMouseMove={e => {
              if (activeIndex === index) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = e.currentTarget
                .closest('[data-chart-container]')
                ?.getBoundingClientRect();
              if (containerRect) {
                setTooltipPosition({
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top,
                });
              }
            }}
            onMouseLeave={e => {
              const relatedTarget = e.relatedTarget as Node | null;
              const currentTarget = e.currentTarget;

              if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
                setActiveIndex(null);
                setTooltipPosition(null);
              }
            }}
          >
            <StyledLegendColorBox color={category?.color} />
            <Typography
              variant="body2"
              sx={{ fontSize: '0.875rem', fontWeight: 400 }}
            >
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </Typography>
          </StyledLegendItem>
        );
      })}
    </StyledLegend>
  );
};

export default CustomLegend;
