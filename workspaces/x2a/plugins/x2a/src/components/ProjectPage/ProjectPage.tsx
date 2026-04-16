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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  RUN_INIT_DEEP_LINK_HASH,
  RUN_NEXT_DEEP_LINK_HASH,
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
import {
  RetriggerInitConfirmDialog,
  RetriggerInitConfirmDialogCopyVariant,
} from '../RetriggerInitConfirmDialog';
import { ProjectActions, ProjectActionsProps } from './ProjectActions';
import {
  extractResponseError,
  isHttpSuccessResponse,
  canRunNextPhase,
  isEligibleForRetriggerInit,
} from '../tools';

export const ProjectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useRouteRefParams(projectRouteRef);
  const rootPath = useRouteRef(rootRouteRef);
  const clientService = useClientService();
  const { runAllForProject, retriggerInit } = useBulkRun();
  const { canWriteProject } = useProjectWriteAccess();
  const runInitDeepLinkHandledRef = useRef(false);
  const runNextDeepLinkHandledRef = useRef(false);
  const [error, setError] = useState<Error | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retriggerInitModalOpen, setRetriggerInitModalOpen] = useState(false);
  const [retriggerInitDialogCopyVariant, setRetriggerInitDialogCopyVariant] =
    useState<RetriggerInitConfirmDialogCopyVariant>('retrigger');
  const [isRetriggeringInit, setIsRetriggeringInit] = useState(false);
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

    if (!isHttpSuccessResponse(projectResponse)) {
      throw new Error(
        await extractResponseError(projectResponse, 'Failed to load project'),
      );
    }
    if (!isHttpSuccessResponse(modulesResponse)) {
      throw new Error(
        await extractResponseError(modulesResponse, 'Failed to load project'),
      );
    }

    const modulesBody = await modulesResponse.json();
    if (!Array.isArray(modulesBody)) {
      throw new Error('Failed to load project modules');
    }

    return {
      project: (await projectResponse.json()) as Project,
      modules: modulesBody as Module[],
    };
  }, [projectId, clientService]);

  const project = pageData?.project;
  const modules = pageData?.modules;

  useEffect(() => {
    runInitDeepLinkHandledRef.current = false;
    runNextDeepLinkHandledRef.current = false;
  }, [projectId]);

  const openBulkRunDialog = useCallback(() => {
    setError(null);
    handleMenuClose();
    setBulkRunModalOpen(true);
  }, [handleMenuClose]);

  const handleRunAllClick = useCallback(() => {
    openBulkRunDialog();
  }, [openBulkRunDialog]);

  const openRetriggerInitDialog = useCallback(
    (opts?: { copyVariant?: RetriggerInitConfirmDialogCopyVariant }) => {
      setError(null);
      handleMenuClose();
      setRetriggerInitDialogCopyVariant(opts?.copyVariant ?? 'retrigger');
      setRetriggerInitModalOpen(true);
    },
    [handleMenuClose],
  );

  useEffect(() => {
    if (isLoading || !project) return;

    const { hash, pathname, search } = location;
    if (hash !== RUN_INIT_DEEP_LINK_HASH && hash !== RUN_NEXT_DEEP_LINK_HASH) {
      return;
    }

    if (hash === RUN_INIT_DEEP_LINK_HASH) {
      if (runInitDeepLinkHandledRef.current) return;
      runInitDeepLinkHandledRef.current = true;
    } else {
      if (runNextDeepLinkHandledRef.current) return;
      runNextDeepLinkHandledRef.current = true;
    }

    navigate({ pathname, search, hash: '' }, { replace: true });

    if (hash === RUN_INIT_DEEP_LINK_HASH) {
      if (canWriteProject(project) && isEligibleForRetriggerInit(project)) {
        openRetriggerInitDialog({ copyVariant: 'firstTrigger' });
      }
    } else if (
      canWriteProject(project) &&
      (modules ?? []).some(m => canRunNextPhase(m, project))
    ) {
      openBulkRunDialog();
    }
  }, [
    isLoading,
    project,
    modules,
    location,
    navigate,
    canWriteProject,
    openRetriggerInitDialog,
    openBulkRunDialog,
  ]);

  const handleRetriggerInitClick = useCallback(() => {
    openRetriggerInitDialog();
  }, [openRetriggerInitDialog]);

  const handleRetriggerInitModalClose = useCallback(() => {
    if (!isRetriggeringInit) {
      setRetriggerInitModalOpen(false);
      setRetriggerInitDialogCopyVariant('retrigger');
      setError(null);
    }
  }, [isRetriggeringInit]);

  const handleRetriggerInitConfirm = useCallback(
    async (userPrompt: string) => {
      if (!project) return;
      setError(null);
      setIsRetriggeringInit(true);

      try {
        await retriggerInit(project, userPrompt || undefined);
        setRetriggerInitModalOpen(false);
        setRetriggerInitDialogCopyVariant('retrigger');
        forceRefresh();
      } catch (e) {
        setRetriggerInitModalOpen(false);
        setRetriggerInitDialogCopyVariant('retrigger');
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          new Error(
            `${t('retriggerInit.error' as any, {
              name: project.name,
            })}: ${msg}`,
          ),
        );
      } finally {
        setIsRetriggeringInit(false);
      }
    },
    [project, retriggerInit, forceRefresh, t],
  );

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
  const hasEligibleModules =
    !!project && !!modules && modules.some(m => canRunNextPhase(m, project));
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
            handleRetriggerInitClick={handleRetriggerInitClick}
            canRunAll={projectWritePermitted && hasEligibleModules}
            canRetriggerInit={
              projectWritePermitted && isEligibleForRetriggerInit(project)
            }
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

      <RetriggerInitConfirmDialog
        open={retriggerInitModalOpen}
        projectName={project?.name ?? ''}
        isRunning={isRetriggeringInit}
        copyVariant={retriggerInitDialogCopyVariant}
        onConfirm={handleRetriggerInitConfirm}
        onClose={handleRetriggerInitModalClose}
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
