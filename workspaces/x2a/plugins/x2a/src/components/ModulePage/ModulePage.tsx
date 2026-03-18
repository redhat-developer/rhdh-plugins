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
import { useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Grid } from '@material-ui/core';
import {
  resolveScmProvider,
  MigrationPhase,
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { moduleRouteRef } from '../../routes';
import { useClientService } from '../../ClientService';
import { useScmHostMap } from '../../hooks/useScmHostMap';
import { useTranslation } from '../../hooks/useTranslation';
import { usePolledFetch } from '../../hooks/usePolledFetch';
import { useRepoAuthentication } from '../../repoAuth';
import { ArtifactsCard } from './ArtifactsCard';
import { ModuleDetailsCard } from './ModuleDetailsCard';
import { PhasesCard } from './PhasesCard';
import { ModulePageBreadcrumb } from './ModulePageBreadcrumb';

export const ModulePage = () => {
  const { t } = useTranslation();
  const { projectId, moduleId } = useRouteRefParams(moduleRouteRef);

  const clientService = useClientService();
  const repoAuthentication = useRepoAuthentication();
  const hostMap = useScmHostMap();
  const [error, setError] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = useCallback(
    (_event: React.ChangeEvent<{}>, newValue: number) => {
      setActiveTab(newValue);
    },
    [],
  );

  const {
    data,
    loading: isLoading,
    error: fetchError,
    refetch,
  } = usePolledFetch(async () => {
    const [projectResponse, moduleResponse] = await Promise.all([
      clientService.projectsProjectIdGet({ path: { projectId } }),
      clientService.projectsProjectIdModulesModuleIdGet({
        path: { projectId, moduleId },
      }),
    ]);
    return {
      project: (await projectResponse.json()) as Project,
      module: (await moduleResponse.json()) as Module,
    };
  }, [projectId, moduleId, clientService]);

  const project = data?.project;
  const module = data?.module;

  const handleRunPhase = useCallback(
    async (phase: MigrationPhase) => {
      if (!project || phase === 'init') {
        // The init phase belongs to the project's page
        return;
      }
      setError(undefined);

      try {
        const sourceRepoAuthToken = (
          await repoAuthentication.authenticate([
            resolveScmProvider(
              project.sourceRepoUrl,
              hostMap,
            ).getAuthTokenDescriptor(true),
          ])
        )[0].token;
        const targetRepoAuthToken = (
          await repoAuthentication.authenticate([
            resolveScmProvider(
              project.targetRepoUrl,
              hostMap,
            ).getAuthTokenDescriptor(false),
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
          setError(`${t('modulePage.phases.runError')}`);
        }

        refetch();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `${t('modulePage.phases.runError')}`,
        );
      }
    },
    [
      t,
      clientService,
      hostMap,
      projectId,
      moduleId,
      repoAuthentication,
      project,
      refetch,
    ],
  );

  const handleCancelPhase = useCallback(
    async (phase: MigrationPhase) => {
      if (!project || phase === 'init') {
        // The init phase belongs to the project's page
        return;
      }
      setError(undefined);

      try {
        const response =
          await clientService.projectsProjectIdModulesModuleIdCancelPost({
            path: { projectId, moduleId },
            body: { phase },
          });
        if (response.status !== 200) {
          const body = await response
            .json()
            .catch(() => ({}) as { message?: string });
          setError(body?.message || t('modulePage.phases.cancelError'));
        }
        refetch();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('modulePage.phases.cancelError'),
        );
      }
    },
    [clientService, t, projectId, moduleId, project, refetch],
  );

  if (fetchError) {
    return (
      <Page themeId="tool">
        <Header title={t('modulePage.title')} />
        <Content>
          <ResponseErrorPanel error={fetchError} />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title={t('modulePage.title')} />

      <Content>
        <Box mb={2}>
          <ModulePageBreadcrumb
            projectId={projectId}
            projectName={project?.name || ''}
          />
        </Box>
        {error && (
          <Alert severity="error">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {isLoading && <Progress />}
        {!isLoading && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ArtifactsCard
                module={module}
                targetRepoUrl={project?.targetRepoUrl || ''}
                targetRepoBranch={project?.targetRepoBranch || ''}
                migrationPlanArtifact={project?.migrationPlan}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ModuleDetailsCard module={module} />
            </Grid>
            <Grid item xs={12}>
              <PhasesCard
                module={module}
                project={project}
                projectId={projectId}
                moduleId={moduleId}
                onRunPhase={handleRunPhase}
                onCancelPhase={handleCancelPhase}
                activeTab={activeTab}
                handleTabChange={handleTabChange}
              />
            </Grid>
          </Grid>
        )}
      </Content>
    </Page>
  );
};
