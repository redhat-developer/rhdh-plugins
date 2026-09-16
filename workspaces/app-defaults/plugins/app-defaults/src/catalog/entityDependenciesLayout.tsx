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

const graphColumn = {
  lg: '1 / span 6',
  md: '1 / span 6',
  xs: '1 / -1',
} as const;

const listColumn = {
  lg: '7 / -1',
  md: '7 / -1',
  xs: '1 / -1',
} as const;

const gridItemSx = {
  minWidth: 0,
  maxWidth: '100%',
} as const;

/**
 * RHDH Dependencies tab layout: relation graph (`type: info`) on the left,
 * dependency list cards (`type: content`) on the right.
 *
 * @internal
 */
export const EntityDependenciesLayout = ({
  cards,
}: EntityContentLayoutProps) => {
  const graphCards = cards.filter(card => card.type === 'info');
  const listCards = cards.filter(card => !card.type || card.type === 'content');
  const otherCards = cards.filter(
    card => card.type && card.type !== 'info' && card.type !== 'content',
  );

  return (
    <Grid container>
      {graphCards.map((card, index) => (
        <Grid
          item
          key={card.element.key ?? index}
          sx={{
            ...gridItemSx,
            gridColumn: graphColumn,
            gridRow: { md: '1 / span 6', lg: '1 / span 6' },
          }}
        >
          {card.element}
        </Grid>
      ))}
      {listCards.map((card, index) => (
        <Grid
          item
          key={card.element.key ?? index}
          sx={{ ...gridItemSx, gridColumn: listColumn }}
        >
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
