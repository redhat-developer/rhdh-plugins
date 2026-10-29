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

import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  Breadcrumbs,
  Content,
  Header,
  Link,
  MarkdownContent,
  Page,
  Progress,
} from '@backstage/core-components';
import {
  Box,
  Button,
  Tab,
  Tabs,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { MIGRATION_PLAN_MAX_CONTENT_BYTES } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { moduleRouteRef, projectRouteRef, rootRouteRef } from '../../routes';
import { EditActionDialog } from './EditActionDialog';
import { useMigrationPlanEditor } from './useMigrationPlanEditor';

const useStyles = makeStyles(theme => ({
  editor: {
    fontFamily: 'monospace',
    fontSize: theme.typography.body2.fontSize,
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  preview: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    minHeight: 200,
  },
}));

type ActionDialog = 'cancel' | 'reload' | 'save';

/**
 * Edits the project migration plan (route without moduleId) or the migration
 * plan of a module (route with moduleId) through the backend.
 */
export const EditMigrationPlanPage = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const { projectId = '', moduleId } = useParams<{
    projectId: string;
    moduleId?: string;
  }>();
  const rootPath = useRouteRef(rootRouteRef);
  const projectPath = useRouteRef(projectRouteRef);
  const modulePath = useRouteRef(moduleRouteRef);

  const editor = useMigrationPlanEditor({ projectId, moduleId });
  const [dialog, setDialog] = useState<ActionDialog>();
  const [leaveTo, setLeaveTo] = useState<string>();
  const [preview, setPreview] = useState(false);

  const { dirty, status, saving } = editor;

  // Closing or reloading the browser tab would lose the changes silently
  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const documentName = moduleId
    ? t('artifact.types.module_migration_plan')
    : t('artifact.types.migration_plan');
  const backPath = moduleId
    ? modulePath({ projectId, moduleId })
    : projectPath({ projectId });
  const defaultCommitMessage = moduleId
    ? `Manual update of ${editor.module?.name ?? moduleId} migration plan`
    : 'Manual update of migration plan';
  const limitKb = MIGRATION_PLAN_MAX_CONTENT_BYTES / 1024;

  const confirmSave = async (message: string) => {
    const saved = await editor.save(message);
    if (saved) {
      setDialog(undefined);
    }
  };

  const confirmReload = () => {
    setDialog(undefined);
    editor.reload();
  };

  const confirmCancel = () => {
    const target = leaveTo ?? backPath;
    setDialog(undefined);
    setLeaveTo(undefined);
    navigate(target);
  };

  const askToLeave = (to: string) => {
    setLeaveTo(to);
    setDialog('cancel');
  };

  /** In-app links do not fire beforeunload, so a dirty editor confirms here. */
  const guardNavigation =
    (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (saving) {
        event.preventDefault();
        return;
      }
      if (!dirty) {
        return;
      }
      event.preventDefault();
      askToLeave(to);
    };

  const renderBody = () => {
    switch (status) {
      case 'loadingContext':
      case 'loadingDocument':
        return (
          <>
            <Progress />
            <Typography>{t('editMigrationPlan.loading')}</Typography>
          </>
        );
      case 'forbidden':
        return (
          <Alert severity="error">{t('editMigrationPlan.notAllowed')}</Alert>
        );
      case 'unsupported':
        return (
          <Alert severity="info">
            {t('editMigrationPlan.button.bitbucketUnsupported')}
          </Alert>
        );
      case 'authorize':
        return (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={editor.reload}>
                {t('editMigrationPlan.authorize.button' as any, {
                  provider: editor.providerLabel,
                })}
              </Button>
            }
          >
            {editor.authError ??
              t('editMigrationPlan.authorize.message' as any, {
                provider: editor.providerLabel,
              })}
          </Alert>
        );
      case 'failed':
        return (
          <Alert
            severity="error"
            action={
              editor.project ? (
                <Button color="inherit" size="small" onClick={editor.reload}>
                  {t('editMigrationPlan.actions.reload')}
                </Button>
              ) : undefined
            }
          >
            {editor.loadError ?? t('editMigrationPlan.loadError')}
          </Alert>
        );
      default:
        return (
          <>
            {editor.saveError && dialog !== 'save' && (
              <Alert severity="error" className={classes.section}>
                {editor.saveError}
              </Alert>
            )}
            {editor.saved && (
              <Alert severity="success" className={classes.section}>
                {t('editMigrationPlan.saved')}
              </Alert>
            )}
            {editor.tooLarge && (
              <Alert severity="warning" className={classes.section}>
                {t('editMigrationPlan.tooLarge' as any, {
                  limit: String(limitKb),
                })}
              </Alert>
            )}
            {!moduleId && (
              <Alert severity="info" className={classes.section}>
                {t('editMigrationPlan.resyncNote')}
              </Alert>
            )}

            <Tabs
              value={preview ? 1 : 0}
              onChange={(_e, value) => setPreview(value === 1)}
              indicatorColor="primary"
              className={classes.section}
            >
              <Tab label={t('editMigrationPlan.tabs.edit')} />
              <Tab label={t('editMigrationPlan.tabs.preview')} />
            </Tabs>

            {preview ? (
              <div className={`${classes.preview} ${classes.section}`}>
                <MarkdownContent content={editor.content} />
              </div>
            ) : (
              <TextField
                className={classes.section}
                value={editor.content}
                onChange={e => editor.editContent(e.target.value)}
                disabled={saving}
                multiline
                minRows={20}
                maxRows={40}
                fullWidth
                variant="outlined"
                inputProps={{
                  'aria-label': t('editMigrationPlan.editorLabel'),
                  className: classes.editor,
                }}
              />
            )}

            <Box display="flex" alignItems="center" gridGap={8}>
              <Button
                variant="contained"
                color="primary"
                disabled={!dirty || saving || editor.tooLarge}
                onClick={() => setDialog('save')}
              >
                {t('editMigrationPlan.actions.save')}
              </Button>
              <Button
                variant="outlined"
                disabled={saving || !dirty}
                onClick={() => setDialog('reload')}
              >
                {t('editMigrationPlan.actions.reload')}
              </Button>
              {/* nothing to lose when unchanged: close without asking */}
              <Button
                variant="outlined"
                disabled={saving}
                onClick={() =>
                  dirty ? askToLeave(backPath) : navigate(backPath)
                }
              >
                {dirty
                  ? t('editMigrationPlan.actions.cancel')
                  : t('editMigrationPlan.actions.close')}
              </Button>
              {dirty && (
                <Typography variant="body2" color="textSecondary">
                  {t('editMigrationPlan.unsavedChanges')}
                </Typography>
              )}
            </Box>
          </>
        );
    }
  };

  return (
    <Page themeId="tool">
      <Header
        title={t('editMigrationPlan.title' as any, { document: documentName })}
      />
      <Content>
        <Breadcrumbs aria-label="breadcrumb" separator=">">
          <Link to={rootPath()} onClick={guardNavigation(rootPath())}>
            {t('page.title')}
          </Link>
          {/* at most three items: Backstage collapses longer breadcrumbs */}
          {moduleId ? (
            <Link
              to={modulePath({ projectId, moduleId })}
              onClick={guardNavigation(modulePath({ projectId, moduleId }))}
            >
              {editor.module?.name ?? t('modulePage.title')}
            </Link>
          ) : (
            <Link
              to={projectPath({ projectId })}
              onClick={guardNavigation(projectPath({ projectId }))}
            >
              {editor.project?.name ?? t('projectPage.title')}
            </Link>
          )}
          {t('editMigrationPlan.breadcrumb')}
        </Breadcrumbs>
        <Box mt={2}>{renderBody()}</Box>
      </Content>

      <EditActionDialog
        open={dialog === 'cancel'}
        title={t('editMigrationPlan.dialogs.cancel.title')}
        message={t('editMigrationPlan.dialogs.cancel.message')}
        confirmLabel={t('editMigrationPlan.dialogs.cancel.confirm')}
        onConfirm={confirmCancel}
        onClose={() => setDialog(undefined)}
      />
      <EditActionDialog
        open={dialog === 'reload'}
        title={t('editMigrationPlan.dialogs.reload.title')}
        message={t('editMigrationPlan.dialogs.reload.message')}
        confirmLabel={t('editMigrationPlan.dialogs.reload.confirm')}
        onConfirm={confirmReload}
        onClose={() => setDialog(undefined)}
      />
      <EditActionDialog
        open={dialog === 'save'}
        title={t('editMigrationPlan.dialogs.save.title')}
        message={t('editMigrationPlan.dialogs.save.message' as any, {
          branch: editor.project?.targetRepoBranch ?? '',
        })}
        confirmLabel={t('editMigrationPlan.dialogs.save.confirm')}
        isBusy={saving}
        error={editor.saveError}
        commitMessage={{
          label: t('editMigrationPlan.dialogs.save.commitMessageLabel'),
          defaultValue: defaultCommitMessage,
        }}
        onConfirm={confirmSave}
        onClose={() => setDialog(undefined)}
      />
    </Page>
  );
};
