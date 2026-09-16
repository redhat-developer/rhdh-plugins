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

import { styled } from '@mui/material/styles';
import { Button, Tooltip } from '@patternfly/react-core';
import { AddCircleOIcon, TimesIcon } from '@patternfly/react-icons';

import { useTranslation } from '../../hooks/useTranslation';
import { SidebarCollapseIcon, SidebarExpandIcon } from './SidebarCollapseIcon';

const HEADER_ICON_SIZE = 18;

const iconStyle = {
  width: HEADER_ICON_SIZE,
  height: HEADER_ICON_SIZE,
  display: 'block',
} as const;

const Actions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export interface NotebookHeaderActionsProps {
  className?: string;
  onClose: () => void;
  onOpenUploadModal: () => void;
  uploadsInProgress: boolean;
  uploadModalOpen: boolean;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
}

export const NotebookHeaderActions = ({
  className,
  onClose,
  onOpenUploadModal,
  uploadsInProgress,
  uploadModalOpen,
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: NotebookHeaderActionsProps) => {
  const { t } = useTranslation();

  return (
    <Actions className={className}>
      <Tooltip content={t('notebook.view.close')} position="bottom">
        <Button
          variant="plain"
          onClick={onClose}
          aria-label={t('notebook.view.close')}
          isDisabled={uploadModalOpen}
        >
          <TimesIcon style={iconStyle} />
        </Button>
      </Tooltip>
      <Tooltip
        content={
          uploadsInProgress
            ? t('notebook.view.documents.uploadsInProgress')
            : t('notebook.view.documents.add')
        }
        position="bottom"
      >
        <Button
          variant="plain"
          onClick={onOpenUploadModal}
          aria-label={t('notebook.view.documents.add')}
          isDisabled={uploadsInProgress || uploadModalOpen}
        >
          <AddCircleOIcon
            style={{
              ...iconStyle,
              color: 'var(--pf-t--global--color--brand--default)',
            }}
          />
        </Button>
      </Tooltip>
      <Tooltip
        content={
          sidebarCollapsed
            ? t('notebook.view.sidebar.expand')
            : t('notebook.view.sidebar.collapse')
        }
        position="bottom"
      >
        <Button
          variant="plain"
          onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
          aria-label={
            sidebarCollapsed
              ? t('notebook.view.sidebar.expand')
              : t('notebook.view.sidebar.collapse')
          }
          isDisabled={uploadModalOpen}
        >
          {sidebarCollapsed ? (
            <SidebarExpandIcon size={HEADER_ICON_SIZE} />
          ) : (
            <SidebarCollapseIcon size={HEADER_ICON_SIZE} />
          )}
        </Button>
      </Tooltip>
    </Actions>
  );
};
