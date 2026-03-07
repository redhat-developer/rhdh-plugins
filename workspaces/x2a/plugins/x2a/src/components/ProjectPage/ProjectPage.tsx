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
import useAsync from 'react-use/lib/useAsync';
import { useNavigate } from 'react-router-dom';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { projectRouteRef, rootRouteRef } from '../../routes';
import { ProjectPageBreadcrumb } from './ProjectPageBreadcrumb';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import { ProjectModulesCard } from './ProjectModulesCard';
import { InitPhaseCard } from './InitPhaseCard';
import { DeleteProjectDialog } from '../DeleteProjectDialog';
import { ProjectActions, ProjectActionsProps } from './ProjectActions';
import { extractResponseError } from '../tools';

const useStyles = makeStyles(theme => ({
  errorAlert: {
    marginBottom: theme.spacing(2),
  },
}));

export const ProjectPage = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const { projectId } = useRouteRefParams(projectRouteRef);
  const rootPath = useRouteRef(rootRouteRef);
  const clientService = useClientService();
  const [error, setError] = useState<string | undefined>();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    setError(undefined);
    handleMenuClose();
    setDeleteModalOpen(true);
  }, [handleMenuClose]);

  const handleDeleteModalClose = useCallback(() => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setError(undefined);
    }
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    setError(undefined);
    setIsDeleting(true);

    try {
      const response = await clientService.projectsProjectIdDelete({
        path: { projectId },
      });
      setDeleteModalOpen(false);

      if (!response.ok) {
        setError(
          await extractResponseError(response, t('projectPage.deleteError')),
        );
        return;
      }

      navigate(rootPath());
    } catch (e) {
      setDeleteModalOpen(false);
      setError((e as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }, [clientService, projectId, navigate, rootPath, t]);

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
      <Header title={t('projectPage.title')}>
        {project && (
          <ProjectActions
            menuOpen={menuOpen}
            handleMenuOpen={handleMenuOpen}
            handleMenuClose={handleMenuClose}
            menuAnchorEl={menuAnchorEl}
            handleDeleteClick={handleDeleteClick}
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

      <Content>
        <Box mb={2}>
          <ProjectPageBreadcrumb />
        </Box>

        {error && (
          <Alert severity="error" className={classes.errorAlert}>
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
          </Grid>
        )}
      </Content>
    </Page>
  );
};
