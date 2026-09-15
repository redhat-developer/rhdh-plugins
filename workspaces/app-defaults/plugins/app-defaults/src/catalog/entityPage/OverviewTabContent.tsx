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
  EntityConsumingComponentsCard,
  EntityHasApisCard,
  EntityProvidingComponentsCard,
} from '@backstage/plugin-api-docs';
import {
  EntityAboutCard,
  EntityHasComponentsCard,
  EntityHasResourcesCard,
  EntityHasSystemsCard,
  EntityLinksCard,
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  EntityRelationWarning,
  EntitySwitch,
  hasCatalogProcessingErrors,
  hasRelationWarnings,
  isKind,
  isOrphan,
} from '@backstage/plugin-catalog';
import { EntityCatalogGraphCard } from '@backstage/plugin-catalog-graph';
import {
  EntityGroupProfileCard,
  EntityMembersListCard,
  EntityOwnershipCard,
  EntityUserProfileCard,
} from '@backstage/plugin-org';

import Grid from './Grid';
import { hasLinks } from './utils';

export const OverviewTabContent = () => (
  <>
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
    <Grid
      item
      sx={{
        gridColumn: {
          lg: '1 / span 4',
          md: '1 / span 6',
          xs: '1 / -1',
        },
        gridRow: 'span 2',
      }}
    >
      <Grid container>
        <EntitySwitch>
          <EntitySwitch.Case if={hasLinks}>
            <Grid item sx={{ gridColumn: '1 / -1' }}>
              <EntityLinksCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
        <Grid item sx={{ gridColumn: '1 / -1' }}>
          <EntityAboutCard />
        </Grid>
      </Grid>
    </Grid>
    <EntitySwitch>
      <EntitySwitch.Case if={isKind('domain')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityCatalogGraphCard height={400} />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityHasSystemsCard />
        </Grid>
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isKind('group')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityGroupProfileCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityOwnershipCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityMembersListCard />
        </Grid>
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isKind('user')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityUserProfileCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityOwnershipCard />
        </Grid>
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isKind('api')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityCatalogGraphCard height={400} />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '1 / span 6',
              xs: '1 / -1',
            },
          }}
        >
          <EntityProvidingComponentsCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '7 / span 6',
              xs: '1 / -1',
            },
          }}
        >
          <EntityConsumingComponentsCard />
        </Grid>
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isKind('system')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityCatalogGraphCard height={400} />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityHasComponentsCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '1 / span 6',
              xs: '1 / -1',
            },
          }}
        >
          <EntityHasApisCard />
        </Grid>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '7 / span 6',
              xs: '1 / -1',
            },
          }}
        >
          <EntityHasResourcesCard />
        </Grid>
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isKind('resource')}>
        <Grid
          item
          sx={{
            gridColumn: {
              lg: '5 / -1',
              md: '7 / -1',
              xs: '1 / -1',
            },
          }}
        >
          <EntityCatalogGraphCard height={400} />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </>
);
