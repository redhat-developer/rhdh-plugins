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

/**
 * Port of rhdh/packages/app/src/components/catalog/Grid/Grid.tsx
 * (container-query grid columns; not viewport breakpoints).
 */

import type { PropsWithChildren } from 'react';

import Box, { BoxProps } from '@mui/material/Box';
import { styled } from '@mui/material/styles';

const BREAKPOINTS = {
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type GridColumn = Partial<Record<Breakpoint, number | string>>;

function normalize(value?: number | string) {
  if (typeof value === 'number') return `span ${value}`;
  return value;
}

function extractGridColumn(sx: BoxProps['sx']): GridColumn | undefined {
  if (!sx || typeof sx !== 'object' || Array.isArray(sx)) return undefined;
  const gc = (sx as { gridColumn?: GridColumn | string }).gridColumn;
  if (!gc || typeof gc !== 'object') return undefined;
  return gc;
}

function removeGridColumn(sx: BoxProps['sx']) {
  if (!sx || typeof sx !== 'object' || Array.isArray(sx)) return sx;
  const next = { ...(sx as Record<string, unknown>) };
  delete next.gridColumn;
  return next;
}

const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: theme.spacing(3),
  gridAutoFlow: 'row',
  alignItems: 'start',
  containerType: 'inline-size',
}));

const GridItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'gridColumnConfig',
})<{ gridColumnConfig: GridColumn }>(({ gridColumnConfig }) => {
  const rules: Record<string, unknown> = {
    gridColumn: normalize(gridColumnConfig.xs ?? '1 / -1'),
  };

  (Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[]).forEach(bp => {
    const value = gridColumnConfig[bp];
    if (!value) return;

    rules[`@container (min-width: ${BREAKPOINTS[bp]}px)`] = {
      gridColumn: normalize(value),
    };
  });

  return rules;
});

type GridProps = PropsWithChildren<
  {
    container?: boolean;
    item?: boolean;
  } & BoxProps
>;

const Grid = ({
  container = false,
  item = true,
  children,
  sx,
  ...props
}: GridProps) => {
  if (container) {
    return (
      <GridContainer {...props} sx={sx}>
        {children}
      </GridContainer>
    );
  }

  if (item) {
    const gridColumnConfig = extractGridColumn(sx) ?? {};
    const itemSx = removeGridColumn(sx);

    return (
      <GridItem {...props} gridColumnConfig={gridColumnConfig} sx={itemSx}>
        {children}
      </GridItem>
    );
  }

  return null;
};

export default Grid;
