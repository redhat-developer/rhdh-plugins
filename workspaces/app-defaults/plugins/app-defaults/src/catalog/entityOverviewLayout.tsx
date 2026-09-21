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

import {
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  EntityRelationWarning,
  EntitySwitch,
  hasCatalogProcessingErrors,
  hasRelationWarnings,
  isOrphan,
} from '@backstage/plugin-catalog';
import type { EntityContentLayoutProps } from '@backstage/plugin-catalog-react/alpha';

import { Grid } from './entityPage/Grid';

const leftColumn = {
  lg: '1 / span 4',
  md: '1 / span 6',
  xs: '1 / -1',
} as const;

const rightColumn = {
  lg: '5 / -1',
  md: '7 / -1',
  xs: '1 / -1',
} as const;

const fullWidthColumn = {
  xs: '1 / -1',
} as const;

/**
 * RHDH overview layout: NFS-composed cards with info (About, Links) on the left
 * and content cards on the right, matching RHDH 1.10 / demo.backstage.io.
 *
 * @internal
 */
export const EntityOverviewLayout = ({ cards }: EntityContentLayoutProps) => {
  const infoCards = cards.filter(card => card.type === 'info');
  const contentCards = cards.filter(
    card => !card.type || card.type === 'content',
  );
  const ungroupedCards = cards.filter(
    card => card.type && card.type !== 'info' && card.type !== 'content',
  );

  const hasInfo = infoCards.length > 0;
  const hasContent = contentCards.length > 0;
  // Info always stays in the left column (never stretches full width).
  // Content uses the right column when info is present; otherwise it spans
  // full width (e.g. after dependency cards move off Overview).
  const infoColumn = leftColumn;
  const contentColumn = hasInfo ? rightColumn : fullWidthColumn;

  return (
    <Grid container>
      <EntitySwitch>
        <EntitySwitch.Case if={isOrphan}>
          <Grid item sx={{ gridColumn: '1 / -1' }}>
            <EntityOrphanWarning />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
      <EntitySwitch>
        <EntitySwitch.Case if={hasRelationWarnings}>
          <Grid item sx={{ gridColumn: '1 / -1' }}>
            <EntityRelationWarning />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
      <EntitySwitch>
        <EntitySwitch.Case if={hasCatalogProcessingErrors}>
          <Grid item sx={{ gridColumn: '1 / -1' }}>
            <EntityProcessingErrorsPanel />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
      {hasInfo ? (
        <Grid
          item
          sx={{
            gridColumn: infoColumn,
            gridRow: hasContent ? 'span 2' : undefined,
          }}
        >
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
      {contentCards.map((card, index) => (
        <Grid
          item
          key={card.element.key ?? index}
          sx={{ gridColumn: contentColumn }}
        >
          {card.element}
        </Grid>
      ))}
      {ungroupedCards.map((card, index) => (
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
