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

import { Typography } from '@material-ui/core';
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
import { makeStyles } from '../../utils/makeStyles';
import { FileTypeIcon } from './FileTypeIcon';
import { SidebarCollapseIcon } from './SidebarCollapseIcon';

const useStyles = makeStyles(theme => ({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: theme.spacing(2),
    overflow: 'hidden',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(1),
  },
  title: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: '2rem',
    letterSpacing: '-0.25px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  collapseButton: {
    flexShrink: 0,
  },
  documentsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentCount: {
    fontWeight: 700,
    fontSize: '1.125rem',
    lineHeight: '2rem',
  },
  addButton: {
    textTransform: 'none',
  },
  documentsList: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    overflowY: 'auto',
    flex: 1,
  },
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)}px ${theme.spacing(0.5)}px`,
    borderRadius: 4,
  },
  fileIcon: {
    flexShrink: 0,
    color: theme.palette.grey[500],
    fontSize: '1rem',
  },
  fileName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  spinnerContainer: {
    flexShrink: 0,
  },
  kebabToggle: {
    padding: 0,
    flexShrink: 0,
  },
  kebabDropdownMenu: {
    '& .pf-v6-c-menu__list': {
      paddingInlineStart: 0,
      marginBlockStart: 0,
      marginBlockEnd: 0,
    },
  },
}));

type DocumentSidebarProps = {
  notebookName: string;
  documents: SessionDocument[];
  uploadingFileNames: string[];
  completedFileNames?: Set<string>;
  deletingDocumentIds?: Set<string>;
  collapsed: boolean;
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
  onToggleCollapse,
  onAddDocument,
  onDeleteDocument,
}: DocumentSidebarProps) => {
  const classes = useStyles();
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
    <div className={classes.sidebar}>
      <div className={classes.titleRow}>
        <Typography className={classes.title}>{notebookName}</Typography>
        <Tooltip content={t('notebook.view.sidebar.collapse')} position="right">
          <Button
            variant="plain"
            className={classes.collapseButton}
            onClick={onToggleCollapse}
            aria-label={t('notebook.view.sidebar.collapse')}
          >
            <SidebarCollapseIcon />
          </Button>
        </Tooltip>
      </div>

      <div className={classes.documentsRow}>
        <Typography className={classes.documentCount}>
          {t('notebook.view.documents.count', {
            count: totalCount,
          } as any)}
        </Typography>
        {isAddDisabled ? (
          <Tooltip
            content={t('notebook.view.documents.maxReached')}
            position="top"
          >
            <span>
              <Button
                variant="link"
                className={classes.addButton}
                icon={<PlusCircleIcon />}
                isDisabled
              >
                {t('notebook.view.documents.add')}
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            variant="link"
            className={classes.addButton}
            icon={<PlusCircleIcon />}
            onClick={onAddDocument}
          >
            {t('notebook.view.documents.add')}
          </Button>
        )}
      </div>

      {(documents.length > 0 || activePending.length > 0) && (
        <div className={classes.documentsList}>
          {documents.map(doc => (
            <div key={doc.document_id} className={classes.documentItem}>
              <FileTypeIcon fileName={doc.title} />
              <Typography className={classes.fileName}>{doc.title}</Typography>
              {deletingDocumentIds?.has(doc.document_id) ? (
                <div className={classes.spinnerContainer}>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.document.delete')}
                  />
                </div>
              ) : (
                <Dropdown
                  className={classes.kebabDropdownMenu}
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
                      className={classes.kebabToggle}
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
                </Dropdown>
              )}
            </div>
          ))}
          {activePending.map(fileName => (
            <div key={`pending-${fileName}`} className={classes.documentItem}>
              <FileTypeIcon fileName={fileName} />
              <Typography className={classes.fileName}>{fileName}</Typography>
              {!completedFileNames?.has(fileName) && (
                <div className={classes.spinnerContainer}>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.view.documents.uploading')}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
