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

import { ChatbotHeaderCloseButton } from '@patternfly/chatbot';
import { Button, Icon, Tooltip } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';

import { useTranslation } from '../../hooks/useTranslation';
import { SidebarCollapseIcon, SidebarExpandIcon } from './SidebarCollapseIcon';

export interface NotebookHeaderActionsProps {
  onClose: () => void;
  onOpenUploadModal: () => void;
  uploadsInProgress: boolean;
  uploadModalOpen: boolean;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
}

/**
 * Compact notebook controls for ChatbotHeaderMain.
 * Uses PF Chatbot header button chrome (pf-chatbot__button--toggle-menu)
 * so sizing/alignment matches ChatbotHeaderCloseButton / NewChat / Menu.
 */
export const NotebookHeaderActions = ({
  onClose,
  onOpenUploadModal,
  uploadsInProgress,
  uploadModalOpen,
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: NotebookHeaderActionsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <ChatbotHeaderCloseButton
        isCompact
        onClick={onClose}
        isDisabled={uploadModalOpen}
        menuAriaLabel={t('notebook.view.close')}
        tooltipContent={t('notebook.view.close')}
      />
      <div className="pf-chatbot__menu">
        <Tooltip
          content={
            uploadsInProgress
              ? t('notebook.view.documents.uploadsInProgress')
              : t('notebook.view.documents.add')
          }
          position="bottom"
          aria="none"
        >
          <Button
            className="pf-chatbot__button--toggle-menu pf-m-compact"
            variant="plain"
            size="sm"
            onClick={onOpenUploadModal}
            aria-label={t('notebook.view.documents.add')}
            isDisabled={uploadsInProgress || uploadModalOpen}
            icon={
              <Icon size="lg" isInline>
                <AddCircleOIcon color="var(--pf-t--global--color--brand--default)" />
              </Icon>
            }
          />
        </Tooltip>
      </div>
      <div className="pf-chatbot__menu">
        <Tooltip
          content={
            sidebarCollapsed
              ? t('notebook.view.sidebar.expand')
              : t('notebook.view.sidebar.collapse')
          }
          position="bottom"
          aria="none"
        >
          <Button
            className="pf-chatbot__button--toggle-menu pf-m-compact"
            variant="plain"
            size="sm"
            onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed
                ? t('notebook.view.sidebar.expand')
                : t('notebook.view.sidebar.collapse')
            }
            isDisabled={uploadModalOpen}
            icon={
              <Icon size="lg" isInline>
                {sidebarCollapsed ? (
                  <SidebarExpandIcon />
                ) : (
                  <SidebarCollapseIcon />
                )}
              </Icon>
            }
          />
        </Tooltip>
      </div>
    </>
  );
};
