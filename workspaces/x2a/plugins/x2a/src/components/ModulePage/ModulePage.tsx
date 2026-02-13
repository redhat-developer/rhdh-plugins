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
import useAsync from 'react-use/lib/useAsync';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { Content, Header, Page } from '@backstage/core-components';
import { Grid } from '@material-ui/core';

import { moduleRouteRef } from '../../routes';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { ArtifactsCard } from './ArtifactsCard';
import { ModuleDetailsCard } from './ModuleDetailsCard';
import { PhasesCard } from './PhasesCard';
import { ModulePageBreadcrumb } from './ModulePageBreadcrumb';

export const ModulePage = () => {
  const { projectId, moduleId } = useRouteRefParams(moduleRouteRef);
  const clientService = useClientService();
  const { t } = useTranslation();

  const { value: module } = useAsync(async () => {
    const response = await clientService.projectsProjectIdModulesModuleIdGet({
      path: { projectId, moduleId },
    });
    return await response.json();
  }, [moduleId]);

  return (
    <Page themeId="tool">
      <Header
        title={
          <>
            <ModulePageBreadcrumb />
            <p>{t('modulePage.title')}</p>
          </>
        }
      />

      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ArtifactsCard module={module} />
          </Grid>
          <Grid item>
            <ModuleDetailsCard module={module} />
          </Grid>
          <Grid item>
            <PhasesCard module={module} />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
