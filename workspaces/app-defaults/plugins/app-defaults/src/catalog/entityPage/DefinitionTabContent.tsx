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

import { EntityApiDefinitionCard } from '@backstage/plugin-api-docs';
import { EntitySwitch, isKind } from '@backstage/plugin-catalog';

import Grid from './Grid';

export const DefinitionTabContent = () => (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('api')}>
      <Grid item sx={{ gridColumn: '1 / -1' }}>
        <EntityApiDefinitionCard />
      </Grid>
    </EntitySwitch.Case>
  </EntitySwitch>
);
