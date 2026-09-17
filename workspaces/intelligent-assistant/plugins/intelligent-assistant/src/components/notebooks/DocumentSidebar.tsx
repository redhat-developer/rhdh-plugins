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

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
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
import {
  AddCircleOIcon,
  EllipsisVIcon,
  PenIcon,
  TrashIcon,
} from '@patternfly/react-icons';

import { NOTEBOOK_MAX_FILES, NOTEBOOK_MAX_TITLE_LENGTH } from '../../const';
import { useInlineEdit } from '../../hooks/notebooks/useInlineEdit';
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

const NotebookTitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '1.25rem',
  lineHeight: '2rem',
  letterSpacing: '-0.25px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: '0 1 auto',
  minWidth: 0,
  cursor: 'pointer',
  borderRadius: 4,
  padding: '2px 6px',
  '&:hover': {
    backgroundColor:
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
});

const TitleInput = styled(TextInput)({
  flex: 1,
  minWidth: 0,
  '--pf-v6-c-form-control--FontSize': '1.25rem',
  '--pf-v6-c-form-control--LineHeight': '2rem',
  '--pf-v6-c-form-control--before--BorderStyle': 'none',
  '& input': {
    fontWeight: 500,
    letterSpacing: '-0.25px',
    padding: '0 4px',
    outline: 'none',
  },
});

const CollapseButton = styled(Button)({
  flexShrink: 0,
});

const DocumentsRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const DocumentCount = styled(Typography)({
  fontWeight: 700,
  fontSize: '1.125rem',
  lineHeight: '2rem',
});

const AddButton = styled(Button)({
  textTransform: 'none',
});

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
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  padding: `${theme.spacing(1)} ${theme.spacing(0.5)}`,
  borderRadius: 4,
  '&:hover': {
    backgroundColor:
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
  '&:hover .doc-kebab': {
    visibility: 'visible',
  },
  '&:focus-within .doc-kebab': {
    visibility: 'visible',
  },
}));

const FileName = styled(Typography)({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  cursor: 'pointer',
  borderRadius: 4,
  padding: '2px 6px',
  '&:hover': {
    backgroundColor:
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
});

const RenameContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  flex: 1,
  minWidth: 0,
});

const RenameInput = styled(TextInput)({
  flex: 1,
  minWidth: 0,
  alignItems: 'center',
  '--pf-v6-c-form-control--m-error--after--BorderWidth': '2px',
  '--pf-v6-c-form-control--FontSize': '0.875rem',
  '--pf-v6-c-form-control--LineHeight': '1.25rem',
  '& input': {
    padding: '2px 4px',
    outline: 'none',
  },
  '& .pf-v6-c-form-control__utilities': {
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
});

const RenameExtension = styled(Typography)({
  flexShrink: 0,
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  whiteSpace: 'nowrap',
});

const RenameHelperText = styled('div')({
  width: '100%',
  paddingTop: 4,
  '& .pf-v6-c-helper-text__item-text': {
    color: 'var(--pf-t--global--color--status--danger--default)',
  },
});

const SpinnerContainer = styled('div')({
  flexShrink: 0,
});

const KebabToggle = styled(MenuToggle)({
  padding: 0,
  flexShrink: 0,
  visibility: 'hidden',
});

const KebabDropdown = styled(Dropdown)({
  '& .pf-v6-c-menu__list': {
    paddingInlineStart: 0,
    marginBlockStart: 0,
    marginBlockEnd: 0,
  },
});

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
  onRenameNotebook?: (newName: string) => void;
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
  onRenameNotebook,
}: DocumentSidebarProps) => {
  const { t } = useTranslation();
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const getValidationError = useCallback(
    (docId: string, originalTitle: string): string | null => {
      const trimmedBase = editName.trim();
      if (!trimmedBase) return null;
      const { baseName, extension } = splitFileName(originalTitle);
      if (trimmedBase === baseName) return null;
      const newFullName = trimmedBase + extension;
      if (newFullName.length > NOTEBOOK_MAX_TITLE_LENGTH) {
        return t('notebook.document.rename.tooLong');
      }
      const conflict = documents.some(
        d => d.document_id !== docId && d.title === newFullName,
      );
      return conflict ? t('notebook.document.rename.conflict') : null;
    },
    [editName, documents, t],
  );

  const saveRename = useCallback(
    (docId: string, originalTitle: string) => {
      const trimmedBase = editName.trim();
      const { baseName, extension } = splitFileName(originalTitle);
      if (!trimmedBase || trimmedBase === baseName) {
        cancelEditing();
        return;
      }
      const newFullName = trimmedBase + extension;
      if (newFullName.length > NOTEBOOK_MAX_TITLE_LENGTH) {
        cancelEditing();
        return;
      }
      if (
        documents.some(d => d.document_id !== docId && d.title === newFullName)
      ) {
        cancelEditing();
        return;
      }
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

  const {
    isEditing: isEditingTitle,
    editValue: editTitle,
    setEditValue: setEditTitle,
    inputRef: titleInputRef,
    startEditing: startEditingTitle,
    save: saveTitle,
    handleKeyDown: handleTitleKeyDown,
  } = useInlineEdit({
    currentName: notebookName,
    onSave: newName => onRenameNotebook?.(newName),
  });

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
        {isEditingTitle ? (
          <TitleInput
            ref={titleInputRef}
            value={editTitle}
            onChange={(_event, value) => setEditTitle(value)}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
            aria-label={t('notebooks.rename.inline.tooltip')}
          />
        ) : (
          <NotebookTitle
            title={t('notebooks.rename.inline.tooltip')}
            onClick={startEditingTitle}
          >
            {notebookName}
          </NotebookTitle>
        )}
        <Tooltip content={t('notebook.view.sidebar.collapse')} position="right">
          <CollapseButton
            variant="plain"
            onClick={onToggleCollapse}
            aria-label={t('notebook.view.sidebar.collapse')}
          >
            <SidebarCollapseIcon />
          </CollapseButton>
        </Tooltip>
      </TitleRow>

      <DocumentsRow>
        <DocumentCount>
          {(t as Function)('notebook.view.documents.count', {
            count: totalCount,
          })}
        </DocumentCount>
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
              <AddButton variant="link" icon={<AddCircleOIcon />} isDisabled>
                {t('notebook.view.documents.add')}
              </AddButton>
            </Typography>
          </Tooltip>
        ) : (
          <AddButton
            variant="link"
            icon={<AddCircleOIcon />}
            onClick={onAddDocument}
          >
            {t('notebook.view.documents.add')}
          </AddButton>
        )}
      </DocumentsRow>

      {(documents.length > 0 || activePending.length > 0) && (
        <DocumentsList>
          {documents.map(doc => (
            <DocumentItem key={doc.document_id}>
              <FileTypeIcon fileName={doc.title} />
              {editingDocId === doc.document_id ? (
                (() => {
                  const validationError = getValidationError(
                    doc.document_id,
                    doc.title,
                  );
                  return (
                    <RenameContainer>
                      <RenameInput
                        ref={inputRef}
                        value={editName}
                        onChange={(_event, value) => setEditName(value)}
                        onBlur={() => saveRename(doc.document_id, doc.title)}
                        onKeyDown={event =>
                          handleKeyDown(event, doc.document_id, doc.title)
                        }
                        validated={validationError ? 'error' : 'default'}
                        aria-label={t('notebook.document.rename')}
                      />
                      <RenameExtension>
                        {splitFileName(doc.title).extension}
                      </RenameExtension>
                      {validationError && (
                        <RenameHelperText>
                          <HelperText>
                            <HelperTextItem variant="error">
                              {validationError}
                            </HelperTextItem>
                          </HelperText>
                        </RenameHelperText>
                      )}
                    </RenameContainer>
                  );
                })()
              ) : (
                <FileName
                  title={t('notebook.document.rename.tooltip')}
                  onClick={() => startEditing(doc.document_id, doc.title)}
                >
                  {doc.title}
                </FileName>
              )}
              {deletingDocumentIds?.has(doc.document_id) ? (
                <SpinnerContainer>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.document.delete')}
                  />
                </SpinnerContainer>
              ) : (
                <KebabDropdown
                  isOpen={openMenuDocId === doc.document_id}
                  popperProps={{
                    position: 'end',
                    preventOverflow: true,
                  }}
                  onOpenChange={isOpen =>
                    setOpenMenuDocId(isOpen ? doc.document_id : null)
                  }
                  toggle={toggleRef => (
                    <KebabToggle
                      ref={toggleRef}
                      variant="plain"
                      className="doc-kebab"
                      style={
                        openMenuDocId === doc.document_id
                          ? { visibility: 'visible' }
                          : undefined
                      }
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
                    </KebabToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="rename"
                      icon={<PenIcon />}
                      onClick={event => {
                        event.stopPropagation();
                        startEditing(doc.document_id, doc.title);
                      }}
                    >
                      {t('notebook.document.rename')}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      icon={<TrashIcon />}
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuDocId(null);
                        onDeleteDocument?.(doc.document_id);
                      }}
                    >
                      {t('notebook.document.delete')}
                    </DropdownItem>
                  </DropdownList>
                </KebabDropdown>
              )}
            </DocumentItem>
          ))}
          {activePending.map(fileName => (
            <DocumentItem key={`pending-${fileName}`}>
              <FileTypeIcon fileName={fileName} />
              <FileName>{fileName}</FileName>
              {!completedFileNames?.has(fileName) && (
                <SpinnerContainer>
                  <Spinner
                    size="md"
                    aria-label={t('notebook.view.documents.uploading')}
                  />
                </SpinnerContainer>
              )}
            </DocumentItem>
          ))}
        </DocumentsList>
      )}
    </Sidebar>
  );
};
