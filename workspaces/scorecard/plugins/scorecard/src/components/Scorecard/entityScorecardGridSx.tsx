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

import type { PropsWithChildren } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Container-query breakpoints aligned with RHDH entity page Grid
 * (app-defaults entityPage/Grid.tsx). Columns respond to the entity
 * tab width, not the viewport — so layouts reflow when a docked drawer
 * (e.g. Quickstart) shrinks the main content area.
 *
 * `@container` must target a *descendant* of the element with
 * `containerType` — an element cannot query its own size.
 */
export const ENTITY_SCORECARD_GRID_BREAKPOINTS = {
  sm: 600,
  lg: 1200,
} as const;

const entityScorecardGridContainerSx: SxProps<Theme> = {
  width: '100%',
  containerType: 'inline-size',
};

const entityScorecardGridInnerSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 2,
  alignItems: 'start',
  [`@container (min-width: ${ENTITY_SCORECARD_GRID_BREAKPOINTS.sm}px)`]: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  [`@container (min-width: ${ENTITY_SCORECARD_GRID_BREAKPOINTS.lg}px)`]: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
};

/** Container-query responsive grid for scorecard cards in the entity tab. */
export const EntityScorecardGrid = ({ children }: PropsWithChildren) => (
  <Box sx={entityScorecardGridContainerSx} data-testid="scorecard-entity-grid">
    <Box sx={entityScorecardGridInnerSx}>{children}</Box>
  </Box>
);
