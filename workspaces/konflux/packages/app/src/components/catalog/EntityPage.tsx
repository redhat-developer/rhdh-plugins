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
import { Grid } from '@material-ui/core';
import { EntityLayout, EntitySwitch } from '@backstage/plugin-catalog';

import {
  isKonfluxTabAvailable,
  isKonfluxCiTabAvailable,
  isKonfluxOverviewAvailable,
  KonfluxLatestReleases,
  KonfluxPageComponent,
  KonfluxCIPageComponent,
  KonfluxStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux';

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    <EntitySwitch>
      <EntitySwitch.Case if={isKonfluxOverviewAvailable}>
        <Grid item xs={12}>
          <KonfluxLatestReleases />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    <EntitySwitch>
      <EntitySwitch.Case if={isKonfluxOverviewAvailable}>
        <Grid item md={6} xs={12}>
          <KonfluxStatus />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);

const entityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/konflux-ci"
      title="CI/CD"
      if={isKonfluxCiTabAvailable}
    >
      <KonfluxCIPageComponent />
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/konflux"
      title="Konflux"
      if={isKonfluxTabAvailable}
    >
      <KonfluxPageComponent />
    </EntityLayout.Route>
  </EntityLayout>
);

export { entityPage };
