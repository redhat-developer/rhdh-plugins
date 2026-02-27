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
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { InfoCard } from '@backstage/core-components';

import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';

export const ModuleDetailsCard = ({ module }: { module?: Module }) => {
  const { t } = useTranslation();
  const empty = t('module.phases.none');

  return (
    <InfoCard title={t('modulePage.title')} variant="gridItem">
      <Grid container direction="row" spacing={3}>
        <Grid item xs={4}>
          <ItemField label={t('module.name')} value={module?.name || empty} />
        </Grid>
        <Grid item xs={4}>
          <ItemField
            label={t('module.status')}
            value={module?.status || empty}
          />
        </Grid>
        <Grid item xs={4}>
          <ItemField
            label={t('module.sourcePath')}
            value={module?.sourcePath || empty}
          />
        </Grid>
      </Grid>
    </InfoCard>
  );
};
