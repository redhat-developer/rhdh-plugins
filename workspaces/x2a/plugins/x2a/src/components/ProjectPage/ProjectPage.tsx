/**
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
import { useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Grid } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { projectRouteRef } from '../../routes';
import { ProjectPageBreadcrumb } from './ProjectPageBreadcrumb';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import { ProjectModulesCard } from './ProjectModulesCard';
import { InitPhaseCard } from './InitPhaseCard';

export const ProjectPage = () => {
  const { t } = useTranslation();
  const { projectId } = useRouteRefParams(projectRouteRef);
  const clientService = useClientService();
  // TODO: call actions - delete, sync
  const [error, _] = useState<string | undefined>();

  const {
    value: project,
    loading: projectLoading,
    error: projectError,
  } = useAsync(async () => {
    const response = await clientService.projectsProjectIdGet({
      path: { projectId },
    });
    return await response.json();
  }, [projectId]);

  const {
    value: modules,
    loading: modulesLoading,
    error: modulesError,
  } = useAsync(async () => {
    const response = await clientService.projectsProjectIdModulesGet({
      path: { projectId },
    });
    return await response.json();
  }, [projectId]);

  const loadError = projectError || modulesError;
  if (loadError) {
    return (
      <Page themeId="tool">
        <Header title={t('projectPage.title')} />
        <Content>
          <ResponseErrorPanel error={loadError} />
        </Content>
      </Page>
    );
  }

  const isLoading = projectLoading || modulesLoading;
  return (
    <Page themeId="tool">
      <Header title={t('projectPage.title')} />

      <Content>
        <Box mb={2}>
          <ProjectPageBreadcrumb />
        </Box>
        {error && (
          <Alert severity="error">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {isLoading && <Progress />}
        {!isLoading && project && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ProjectDetailsCard project={project} />
            </Grid>

            <Grid item xs={6}>
              <ProjectModulesCard modules={modules || []} />
            </Grid>

            <Grid item xs={12}>
              <InitPhaseCard project={project} />
            </Grid>
            {/* TODO: actions - delete, sync*/}
          </Grid>
        )}
      </Content>
    </Page>
  );
};
