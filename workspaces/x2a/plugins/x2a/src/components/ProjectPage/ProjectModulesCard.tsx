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
import { Fragment } from 'react';
import { InfoCard, Link } from '@backstage/core-components';
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Divider, Grid, Typography } from '@material-ui/core';
import { useTranslation } from '../../hooks/useTranslation';
import { ModuleStatusCell } from '../ModuleStatusCell';
import { CurrentPhaseCell } from '../CurrentPhaseCell';
import { getLastJob } from '../tools';
import { useRouteRef } from '@backstage/core-plugin-api';
import { moduleRouteRef } from '../../routes';

export const ProjectModulesCard = ({ modules }: { modules: Module[] }) => {
  const { t } = useTranslation();
  const modulePath = useRouteRef(moduleRouteRef);

  return (
    <InfoCard
      title={t('projectModulesCard.title' as any, {
        count: modules.length.toString(),
      })}
      variant="gridItem"
    >
      <Grid container direction="row" spacing={2}>
        {modules.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1">
              {t('projectModulesCard.noModules')}
            </Typography>
          </Grid>
        )}

        {modules.map((module, index) => {
          const lastJob = getLastJob(module);
          return (
            <Fragment key={module.id}>
              <Grid item xs={4}>
                <Link
                  to={modulePath({
                    projectId: module.projectId,
                    moduleId: module.id,
                  })}
                >
                  {module.name}
                </Link>
              </Grid>
              <Grid item xs={4}>
                <ModuleStatusCell status={module.status} />
              </Grid>
              <Grid item xs={4}>
                <CurrentPhaseCell phase={lastJob?.phase} />
              </Grid>
              {index < modules.length - 1 && (
                <Grid item xs={12}>
                  <Divider orientation="horizontal" variant="fullWidth" />
                </Grid>
              )}
            </Fragment>
          );
        })}
      </Grid>
    </InfoCard>
  );
};
