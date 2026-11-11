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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumbs, Content, Link, Page } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { Box } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { orchestratorRootRouteRef } from '../../routes';
import { EditWorkflowFilesDialog } from './EditWorkflowFilesDialog';
import {
  createStarterWorkflowFiles,
  DEFAULT_BUILDER_IDENTITY,
  slugifyWorkflowId,
} from './starterFiles';
import type { WorkflowBuilderFiles, WorkflowBuilderIdentity } from './types';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { WorkflowBuilderCanvas } from './WorkflowBuilderCanvas';
import { WorkflowBuilderHeader } from './WorkflowBuilderHeader';
import styles from './WorkflowBuilderPage.module.css';
import {
  SIDE_PANEL_DEFAULT_WIDTH,
  WorkflowBuilderSidePanel,
} from './WorkflowBuilderSidePanel';

/**
 * Workflow Builder — Start from scratch session (Story 1).
 *
 * UI chrome uses `@backstage/ui` (BUI) to match the prototype.
 *
 * Note: RHDH does not use a React Router data router, so `useBlocker` cannot be
 * used. Unsaved changes are gated via Close + browser beforeunload, and by
 * intercepting same-origin in-app link clicks while the session is dirty.
 */
export const WorkflowBuilderPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orchestratorLink = useRouteRef(orchestratorRootRouteRef);

  const [identity, setIdentity] = useState<WorkflowBuilderIdentity>(
    DEFAULT_BUILDER_IDENTITY,
  );
  const [files, setFiles] = useState<WorkflowBuilderFiles>(() =>
    createStarterWorkflowFiles(DEFAULT_BUILDER_IDENTITY),
  );
  const [dirty, setDirty] = useState(true);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editFilesOpen, setEditFilesOpen] = useState(false);
  const [sidePanelWidth, setSidePanelWidth] = useState(
    SIDE_PANEL_DEFAULT_WIDTH,
  );
  const pendingHrefRef = useRef<string | null>(null);
  // Slug comparison alone can't survive an empty intermediate name; track
  // whether the user has manually edited workflowId instead.
  const autoSyncWorkflowIdRef = useRef(true);

  const pageTitle = identity.name || t('builder.page.defaultTitle');

  const handleIdentityChange = useCallback((next: WorkflowBuilderIdentity) => {
    setIdentity(current => {
      const nameChanged = next.name !== current.name;
      const workflowIdEdited =
        next.workflowId !== current.workflowId && !nameChanged;

      if (workflowIdEdited) {
        const nextSlug = slugifyWorkflowId(next.name);
        // Re-enable auto-sync if the user sets id back to the name slug.
        autoSyncWorkflowIdRef.current =
          nextSlug !== '' && next.workflowId === nextSlug;
      }

      const resolved: WorkflowBuilderIdentity =
        nameChanged && autoSyncWorkflowIdRef.current
          ? {
              ...next,
              workflowId: slugifyWorkflowId(next.name) || current.workflowId,
            }
          : next;
      setFiles(createStarterWorkflowFiles(resolved));
      setDirty(true);
      return resolved;
    });
  }, []);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Still required for a reliable cross-browser unload prompt.
      event.returnValue = ''; // NOSONAR
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor?.href) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      pendingHrefRef.current = `${url.pathname}${url.search}${url.hash}`;
      setLeaveDialogOpen(true);
    };
    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [dirty]);

  const leaveToOrchestrator = useCallback(() => {
    const pendingHref = pendingHrefRef.current;
    pendingHrefRef.current = null;
    setDirty(false);
    setLeaveDialogOpen(false);
    navigate(pendingHref ?? orchestratorLink());
  }, [navigate, orchestratorLink]);

  const cancelLeave = useCallback(() => {
    pendingHrefRef.current = null;
    setLeaveDialogOpen(false);
  }, []);

  const requestClose = useCallback(() => {
    if (dirty) {
      pendingHrefRef.current = orchestratorLink();
      setLeaveDialogOpen(true);
      return;
    }
    navigate(orchestratorLink());
  }, [dirty, navigate, orchestratorLink]);

  return (
    <Page themeId="tool">
      <Content noPadding>
        {/*
          Avoid page-level bg="neutral": TextField/Select are bg-consumers and
          fill with gray. Chrome uses CSS module tokens for light/dark instead.
        */}
        <div className={styles.page} data-testid="workflow-builder-page">
          <div className={styles.headerRegion}>
            <Box p="4" pb="2">
              <Breadcrumbs>
                <Link to={orchestratorLink()}>{t('page.title')}</Link>
                <span style={{ fontStyle: 'normal' }}>{pageTitle}</span>
              </Breadcrumbs>
            </Box>

            <WorkflowBuilderHeader
              identity={identity}
              onIdentityChange={handleIdentityChange}
              onEditFiles={() => setEditFilesOpen(true)}
              onClose={requestClose}
            />
          </div>

          <div className={styles.body}>
            <WorkflowBuilderCanvas />
            <WorkflowBuilderSidePanel
              identity={identity}
              onIdentityChange={handleIdentityChange}
              width={sidePanelWidth}
              onWidthChange={setSidePanelWidth}
            />
          </div>
        </div>
      </Content>

      <EditWorkflowFilesDialog
        open={editFilesOpen}
        files={files}
        workflowId={identity.workflowId}
        onClose={() => setEditFilesOpen(false)}
      />

      <UnsavedChangesDialog
        open={leaveDialogOpen}
        onCancel={cancelLeave}
        onConfirmDiscard={leaveToOrchestrator}
      />
    </Page>
  );
};
