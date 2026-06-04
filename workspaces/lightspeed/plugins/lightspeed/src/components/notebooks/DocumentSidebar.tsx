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

import { useState } from 'react';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import { EllipsisVIcon, PlusCircleIcon } from '@patternfly/react-icons';

import { NOTEBOOK_MAX_FILES } from '../../const';
import { useTranslation } from '../../hooks/useTranslation';
import { SessionDocument } from '../../types';
import { FileTypeIcon } from './FileTypeIcon';
import { SidebarCollapseIcon } from './SidebarCollapseIcon';

const Sidebar = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: theme.spacing(2),
  overflow: 'hidden',
}));

const TitleRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(1),
}));

const DocumentsList = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  overflowY: 'auto',
  flex: 1,
}));

const DocumentItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: `${theme.spacing(1)} ${theme.spacing(0.5)}`,
  borderRadius: 4,
}));

const KebabDropdownMenu = styled(Dropdown)({
  '& .pf-v6-c-menu__list': {
    paddingInlineStart: 0,
    marginBlockStart: 0,
    marginBlockEnd: 0,
  },
});

type DocumentSidebarProps = {
  notebookName: string;
  documents: SessionDocument[];
  uploadingFileNames: string[];
  completedFileNames?: Set<string>;
  deletingDocumentIds?: Set<string>;
  collapsed: boolean;
  hasUploadsInProgress?: boolean;
  onToggleCollapse: () => void;
  onAddDocument: () => void;
  onDeleteDocument?: (documentId: string) => void;
};

export const DocumentSidebar = ({
  notebookName,
  documents,
  uploadingFileNames,
  completedFileNames,
  deletingDocumentIds,
  collapsed,
  hasUploadsInProgress,
  onToggleCollapse,
  onAddDocument,
  onDeleteDocument,
}: DocumentSidebarProps) => {
  const { t } = useTranslation();
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);

  if (collapsed) {
    return null;
  }

  const uploadedNames = new Set(documents.map(d => d.title));
  const activePending = uploadingFileNames.filter(
    name => !uploadedNames.has(name),
  );
  const totalCount = documents.length + activePending.length;
  const isAddDisabled = totalCount >= NOTEBOOK_MAX_FILES;

  return (
    <Sidebar>
      <TitleRow>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '1.25rem',
            lineHeight: '2rem',
            letterSpacing: '-0.25px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {notebookName}
        </Typography>
        <Tooltip content={t('notebook.view.sidebar.collapse')} position="right">
          <Button
            variant="plain"
            style={{ flexShrink: 0 }}
            onClick={onToggleCollapse}
            aria-label={t('notebook.view.sidebar.collapse')}
          >
            <SidebarCollapseIcon />
          </Button>
        </Tooltip>
      </TitleRow>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.125rem',
            lineHeight: '2rem',
          }}
        >
          {t('notebook.view.documents.count', {
            count: totalCount,
          } as any)}
        </Typography>
        {isAddDisabled ? (
          <Tooltip
            content={
              hasUploadsInProgress
                ? t('notebook.view.documents.uploadsInProgress')
                : t('notebook.view.documents.maxReached')
            }
            position="top"
          >
            <Typography component="div">
              <Button
                variant="link"
                style={{ textTransform: 'none' }}
                icon={<PlusCircleIcon />}
                isDisabled
              >
                {t('notebook.view.documents.add')}
              </Button>
            </Typography>
          </Tooltip>
        ) : (
          <Button
            variant="link"
            style={{ textTransform: 'none' }}
            icon={<PlusCircleIcon />}
            onClick={onAddDocument}
          >
            {t('notebook.view.documents.add')}
          </Button>
        )}
      </div>

      {(documents.length > 0 || activePending.length > 0) && (
        <DocumentsList>
          {documents.map(doc => (
            <DocumentItem key={doc.document_id}>
              <FileTypeIcon fileName={doc.title} />
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                }}
              >
                {doc.title}
              </Typography>
              {deletingDocumentIds?.has(doc.document_id) ? (
                <div style={{ flexShrink: 0 }}>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.document.delete')}
                  />
                </div>
              ) : (
                <KebabDropdownMenu
                  isOpen={openMenuDocId === doc.document_id}
                  popperProps={{
                    position: 'end',
                    preventOverflow: true,
                  }}
                  onOpenChange={isOpen =>
                    setOpenMenuDocId(isOpen ? doc.document_id : null)
                  }
                  toggle={toggleRef => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="plain"
                      style={{ padding: 0, flexShrink: 0 }}
                      isExpanded={openMenuDocId === doc.document_id}
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuDocId(current =>
                          current === doc.document_id ? null : doc.document_id,
                        );
                      }}
                      aria-label={t('notebook.document.delete')}
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="delete"
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuDocId(null);
                        onDeleteDocument?.(doc.document_id);
                      }}
                    >
                      {t('notebook.document.delete')}
                    </DropdownItem>
                  </DropdownList>
                </KebabDropdownMenu>
              )}
            </DocumentItem>
          ))}
          {activePending.map(fileName => (
            <DocumentItem key={`pending-${fileName}`}>
              <FileTypeIcon fileName={fileName} />
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                }}
              >
                {fileName}
              </Typography>
              {!completedFileNames?.has(fileName) && (
                <div style={{ flexShrink: 0 }}>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.view.documents.uploading')}
                  />
                </div>
              )}
            </DocumentItem>
          ))}
        </DocumentsList>
      )}
    </Sidebar>
  );
};
