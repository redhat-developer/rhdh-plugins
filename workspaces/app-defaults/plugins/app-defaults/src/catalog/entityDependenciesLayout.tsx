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

import type { EntityContentLayoutProps } from '@backstage/plugin-catalog-react/alpha';

import { Grid } from './entityPage/Grid';

/**
 * Container widths (px) for the Dependencies tab layout only.
 * Independent of {@link ./entityPage/Grid} entity-page breakpoints.
 */
const DEPENDENCIES_LAYOUT_BREAKPOINTS = {
  sm: 600,
  md: 900,
  lg: 1400,
  xl: 1536,
} as const;

/**
 * Min container width for side-by-side info/list columns.
 * Below this, cards stack full width so tables are not squeezed (RHDHBUGS-3893).
 */
const DEPENDENCIES_TWO_COLUMN_MIN_WIDTH = DEPENDENCIES_LAYOUT_BREAKPOINTS.lg;

const fullWidthColumn = {
  xs: '1 / -1',
} as const;

const twoColumnMinQuery = `@container (min-width: ${DEPENDENCIES_TWO_COLUMN_MIN_WIDTH}px)`;

const gridItemSx = {
  minWidth: 0,
  maxWidth: '100%',
} as const;

const twoColumnInfoSx = {
  ...gridItemSx,
  gridColumn: fullWidthColumn,
  [twoColumnMinQuery]: {
    gridColumn: '1 / span 6',
    gridRow: '1 / span 6',
  },
} as const;

const twoColumnListSx = {
  ...gridItemSx,
  gridColumn: fullWidthColumn,
  [twoColumnMinQuery]: {
    gridColumn: '7 / -1',
  },
} as const;

/**
 * RHDH Dependencies tab layout: `type: info` cards in the left column (relations
 * graph by default; adopters may add more), dependency list cards on the right.
 * Multiple info cards share one grid area and stack vertically to avoid overlap.
 *
 * @internal
 */
export const EntityDependenciesLayout = ({
  cards,
}: EntityContentLayoutProps) => {
  const infoCards = cards.filter(card => card.type === 'info');
  const listCards = cards.filter(card => !card.type || card.type === 'content');
  const otherCards = cards.filter(
    card => card.type && card.type !== 'info' && card.type !== 'content',
  );

  const hasInfo = infoCards.length > 0;
  const hasLists = listCards.length > 0;
  // Two-column layout only when both groups are present; otherwise the
  // non-empty group spans full width (e.g. list cards after the graph card
  // is disabled, or graph-only when list cards are absent).
  const useTwoColumns = hasInfo && hasLists;
  const infoSx = useTwoColumns ? twoColumnInfoSx : gridItemSx;
  const listSx = useTwoColumns
    ? twoColumnListSx
    : { ...gridItemSx, gridColumn: fullWidthColumn };

  return (
    <Grid container>
      {hasInfo ? (
        <Grid item sx={infoSx}>
          <Grid container>
            {infoCards.map((card, index) => (
              <Grid
                item
                key={card.element.key ?? index}
                sx={{ gridColumn: '1 / -1' }}
              >
                {card.element}
              </Grid>
            ))}
          </Grid>
        </Grid>
      ) : null}
      {listCards.map((card, index) => (
        <Grid item key={card.element.key ?? index} sx={listSx}>
          {card.element}
        </Grid>
      ))}
      {otherCards.map((card, index) => (
        <Grid
          item
          key={card.element.key ?? index}
          sx={{ gridColumn: '1 / -1' }}
        >
          {card.element}
        </Grid>
      ))}
    </Grid>
  );
};
