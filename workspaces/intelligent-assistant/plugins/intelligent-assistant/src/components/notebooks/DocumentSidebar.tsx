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

import { useCallback, useRef, useState } from 'react';

import { makeStyles, Typography } from '@material-ui/core';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  HelperText,
  HelperTextItem,
  MenuToggle,
  Spinner,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { EllipsisVIcon, PlusCircleIcon } from '@patternfly/react-icons';

import { NOTEBOOK_MAX_FILES } from '../../const';
import { useTranslation } from '../../hooks/useTranslation';
import { SessionDocument } from '../../types';
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
    alignItems: 'flex-start',
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
  renameContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    flex: 1,
    minWidth: 0,
  },
  renameInput: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    // Optional: PF6 default is 1px which is barely visible; can be removed if subtle error border is acceptable
    '--pf-v6-c-form-control--m-error--after--BorderWidth': '2px',
    '--pf-v6-c-form-control--FontSize': '0.875rem',
    '--pf-v6-c-form-control--LineHeight': '1.25rem',
    '--pf-v6-c-form-control--before--BorderStyle': 'none',
    '& input': {
      padding: '2px 4px',
      outline: 'none',
    },
  },
  renameExtension: {
    flexShrink: 0,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    whiteSpace: 'nowrap',
  },
  renameHelperText: {
    width: '100%',
    paddingTop: 4,
    '& .pf-v6-c-helper-text__item-text': {
      color: 'var(--pf-t--global--color--status--danger--default)',
    },
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

const splitFileName = (
  fileName: string,
): { baseName: string; extension: string } => {
  if (!fileName) return { baseName: '', extension: '' };
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) return { baseName: fileName, extension: '' };
  return {
    baseName: fileName.slice(0, lastDot),
    extension: fileName.slice(lastDot),
  };
};

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
  onRenameDocument?: (documentId: string, newTitle: string) => void;
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
  onRenameDocument,
}: DocumentSidebarProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  const startEditing = useCallback((docId: string, currentTitle: string) => {
    const { baseName } = splitFileName(currentTitle);
    setEditingDocId(docId);
    setEditName(baseName);
    setOpenMenuDocId(null);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingDocId(null);
    setEditName('');
    savingRef.current = false;
  }, []);

  const getConflictError = useCallback(
    (docId: string, originalTitle: string): string | null => {
      const trimmedBase = editName.trim();
      if (!trimmedBase) return null;
      const { baseName, extension } = splitFileName(originalTitle);
      if (trimmedBase === baseName) return null;
      const newFullName = trimmedBase + extension;
      const conflict = documents.some(
        d => d.document_id !== docId && d.title === newFullName,
      );
      return conflict ? t('notebook.document.rename.conflict') : null;
    },
    [editName, documents, t],
  );

  const saveRename = useCallback(
    (docId: string, originalTitle: string) => {
      if (savingRef.current) return;
      const trimmedBase = editName.trim();
      const { baseName, extension } = splitFileName(originalTitle);
      if (!trimmedBase || trimmedBase === baseName) {
        cancelEditing();
        return;
      }
      const newFullName = trimmedBase + extension;
      if (
        documents.some(d => d.document_id !== docId && d.title === newFullName)
      ) {
        return;
      }
      savingRef.current = true;
      onRenameDocument?.(docId, newFullName);
      cancelEditing();
    },
    [editName, documents, onRenameDocument, cancelEditing],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, docId: string, originalTitle: string) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveRename(docId, originalTitle);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditing();
      }
    },
    [saveRename, cancelEditing],
  );

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
                className={classes.addButton}
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
              {editingDocId === doc.document_id ? (
                (() => {
                  const conflictError = getConflictError(
                    doc.document_id,
                    doc.title,
                  );
                  return (
                    <div className={classes.renameContainer}>
                      <TextInput
                        ref={inputRef}
                        className={classes.renameInput}
                        value={editName}
                        onChange={(_event, value) => setEditName(value)}
                        onBlur={cancelEditing}
                        onKeyDown={event =>
                          handleKeyDown(event, doc.document_id, doc.title)
                        }
                        validated={conflictError ? 'error' : 'default'}
                        aria-label={t('notebook.document.rename')}
                      />
                      <Typography className={classes.renameExtension}>
                        {splitFileName(doc.title).extension}
                      </Typography>
                      {conflictError && (
                        <div className={classes.renameHelperText}>
                          <HelperText>
                            <HelperTextItem variant="error">
                              {conflictError}
                            </HelperTextItem>
                          </HelperText>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <Typography
                  className={classes.fileName}
                  title={t('notebook.document.rename.tooltip')}
                  onDoubleClick={() => startEditing(doc.document_id, doc.title)}
                >
                  {doc.title}
                </Typography>
              )}
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
                      aria-label={`${t('aria.options.label')} ${doc.title}`}
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="rename"
                      onClick={event => {
                        event.stopPropagation();
                        startEditing(doc.document_id, doc.title);
                      }}
                    >
                      {t('notebook.document.rename')}
                    </DropdownItem>
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
