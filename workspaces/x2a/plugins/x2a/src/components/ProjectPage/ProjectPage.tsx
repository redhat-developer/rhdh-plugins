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
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Grid } from '@material-ui/core';
import {
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { usePolledFetch } from '../../hooks/usePolledFetch';
import { useBulkRun } from '../../hooks/useBulkRun';
import { useProjectWriteAccess } from '../../hooks/useProjectWriteAccess';
import { projectRouteRef, rootRouteRef } from '../../routes';
import { ProjectPageBreadcrumb } from './ProjectPageBreadcrumb';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import { ProjectModulesCard } from './ProjectModulesCard';
import { InitPhaseCard } from './InitPhaseCard';
import { DeleteProjectDialog } from '../DeleteProjectDialog';
import { BulkRunConfirmDialog } from '../BulkRunConfirmDialog';
import { ProjectActions, ProjectActionsProps } from './ProjectActions';
import { extractResponseError } from '../tools';

export const ProjectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useRouteRefParams(projectRouteRef);
  const rootPath = useRouteRef(rootRouteRef);
  const clientService = useClientService();
  const { runAllForProject } = useBulkRun();
  const { canWriteProject } = useProjectWriteAccess();
  const [error, setError] = useState<Error | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkRunModalOpen, setBulkRunModalOpen] = useState(false);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen: ProjectActionsProps['handleMenuOpen'] = useCallback(
    event => {
      setMenuAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setError(null);
    handleMenuClose();
    setDeleteModalOpen(true);
  }, [handleMenuClose]);

  const handleRunAllClick = useCallback(() => {
    setError(null);
    handleMenuClose();
    setBulkRunModalOpen(true);
  }, [handleMenuClose]);

  const handleDeleteModalClose = useCallback(() => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setError(null);
    }
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await clientService.projectsProjectIdDelete({
        path: { projectId },
      });
      setDeleteModalOpen(false);

      if (!response.ok) {
        const message = await extractResponseError(
          response,
          t('projectPage.deleteError'),
        );
        setError(new Error(message));
        return;
      }

      navigate(rootPath());
    } catch (e) {
      setDeleteModalOpen(false);
      setError(e as Error);
    } finally {
      setIsDeleting(false);
    }
  }, [clientService, projectId, navigate, rootPath, t]);

  const {
    data: pageData,
    loading: isLoading,
    error: loadError,
    refetch: forceRefresh,
  } = usePolledFetch(async () => {
    const [projectResponse, modulesResponse] = await Promise.all([
      // run in parallel to avoid blocking the UI, fail at once
      clientService.projectsProjectIdGet({ path: { projectId } }),
      clientService.projectsProjectIdModulesGet({ path: { projectId } }),
    ]);
    return {
      project: (await projectResponse.json()) as Project,
      modules: (await modulesResponse.json()) as Module[],
    };
  }, [projectId, clientService]);

  const project = pageData?.project;
  const modules = pageData?.modules;

  const handleBulkRunModalClose = useCallback(() => {
    if (!isBulkRunning) {
      setBulkRunModalOpen(false);
      setError(null);
    }
  }, [isBulkRunning]);

  const handleBulkRunConfirm = useCallback(async () => {
    if (!project) return;
    setError(null);
    setIsBulkRunning(true);

    try {
      const result = await runAllForProject(project, modules);
      setBulkRunModalOpen(false);

      if (result.failed > 0) {
        setError(
          new Error(t('bulkRun.errorProject' as any, { name: project.name })),
        );
      }
      forceRefresh();
    } catch (e) {
      setBulkRunModalOpen(false);
      setError(e as Error);
    } finally {
      setIsBulkRunning(false);
    }
  }, [project, modules, runAllForProject, forceRefresh, t]);

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

  const projectWritePermitted = !!(project && canWriteProject(project));
  return (
    <Page themeId="tool">
      <Header title={t('projectPage.title')}>
        {project && (
          <ProjectActions
            menuOpen={menuOpen}
            handleMenuOpen={handleMenuOpen}
            handleMenuClose={handleMenuClose}
            menuAnchorEl={menuAnchorEl}
            handleDeleteClick={handleDeleteClick}
            handleRunAllClick={handleRunAllClick}
            canRunAll={projectWritePermitted}
            canDeleteProject={projectWritePermitted}
          />
        )}
      </Header>

      <DeleteProjectDialog
        open={deleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        projectName={project?.name ?? ''}
      />

      <BulkRunConfirmDialog
        idPostfix="project-page"
        open={bulkRunModalOpen}
        title={t('bulkRun.projectPageConfirm.title' as any, {
          name: project?.name ?? '',
        })}
        message={t('bulkRun.projectPageConfirm.message')}
        isRunning={isBulkRunning}
        onConfirm={handleBulkRunConfirm}
        onClose={handleBulkRunModalClose}
      />

      <Content>
        <Box mb={2}>
          <ProjectPageBreadcrumb />
        </Box>

        {error && <ResponseErrorPanel error={error} />}

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
          </Grid>
        )}
      </Content>
    </Page>
  );
};
