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
import { useCallback, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { Content, Header, Page } from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { ModulePhase } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { moduleRouteRef } from '../../routes';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { getAuthTokenDescriptor, useRepoAuthentication } from '../../repoAuth';
import { ArtifactsCard } from './ArtifactsCard';
import { ModuleDetailsCard } from './ModuleDetailsCard';
import { PhasesCard } from './PhasesCard';
import { ModulePageBreadcrumb } from './ModulePageBreadcrumb';

export const ModulePage = () => {
  const { projectId, moduleId } = useRouteRefParams(moduleRouteRef);
  const clientService = useClientService();
  const repoAuthentication = useRepoAuthentication();
  const { t } = useTranslation();
  const [error, setError] = useState<string | undefined>();
  const [refresh, setRefresh] = useState(0);

  const { value: project } = useAsync(async () => {
    const response = await clientService.projectsProjectIdGet({
      path: { projectId },
    });
    return await response.json();
  }, [projectId]);

  const { value: module } = useAsync(async () => {
    const response = await clientService.projectsProjectIdModulesModuleIdGet({
      path: { projectId, moduleId },
    });
    return await response.json();
  }, [moduleId, refresh]);

  const handleRunPhase = useCallback(
    async (phase: ModulePhase) => {
      if (!project) {
        return;
      }
      setError(undefined);

      const sourceRepoAuthToken = (
        await repoAuthentication.authenticate([
          getAuthTokenDescriptor({
            repoUrl: project.sourceRepoUrl,
            readOnly: true,
          }),
        ])
      )[0].token;
      const targetRepoAuthToken = (
        await repoAuthentication.authenticate([
          getAuthTokenDescriptor({
            repoUrl: project.targetRepoUrl,
            readOnly: false,
          }),
        ])
      )[0].token;

      const response =
        await clientService.projectsProjectIdModulesModuleIdRunPost({
          path: { projectId, moduleId },
          body: {
            phase,
            sourceRepoAuth: { token: sourceRepoAuthToken },
            targetRepoAuth: { token: targetRepoAuthToken },
          },
        });

      const responseData = await response.json();
      if (!responseData.jobId) {
        setError('Failed to run phase for module');
      }

      setRefresh(prev => prev + 1);
    },
    [clientService, projectId, moduleId, repoAuthentication, project],
  );

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
        {error && (
          <Alert severity="error">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ArtifactsCard
              module={module}
              targetRepoUrl={project?.targetRepoUrl || ''}
            />
          </Grid>
          <Grid item>
            <ModuleDetailsCard module={module} />
          </Grid>
          <Grid item>
            <PhasesCard module={module} onRunPhase={handleRunPhase} />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
