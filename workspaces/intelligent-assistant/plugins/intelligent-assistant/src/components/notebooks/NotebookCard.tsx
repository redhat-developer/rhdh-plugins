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

import { useCallback } from 'react';

import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  TextInput,
} from '@patternfly/react-core';
import {
  CatalogIcon,
  EllipsisVIcon,
  PenIcon,
  TrashIcon,
} from '@patternfly/react-icons';

import { useInlineEdit } from '../../hooks/notebooks/useInlineEdit';
import { intelligentAssistantTranslationRef } from '../../translations/ref';
import { NotebookSession } from '../../types';
import { formatUpdatedLabel } from '../../utils/notebooks-utils';

type NotebookCardProps = {
  notebook: NotebookSession;
  openNotebookMenuId: string | null;
  setOpenNotebookMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onClick: (notebook: NotebookSession) => void;
  onRename: (sessionId: string, newName: string) => void;
  onDelete: (sessionId: string) => void;
  t: TranslationFunction<typeof intelligentAssistantTranslationRef.T>;
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    borderColor: 'var(--pf-t--global--border--color--hover)',
    borderWidth: '1px',
    borderStyle: 'solid',
    cursor: 'pointer',
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: 0,
  alignItems: 'center',
  '& .pf-v6-c-card__header-aside, & .pf-v6-c-card__actions': {
    marginLeft: theme.spacing(1),
  },
}));

const StyledDropdown = styled(Dropdown)({
  '--pf-v6-c-menu--PaddingBlockStart': '0',
  '--pf-v6-c-menu--PaddingBlockEnd': '0',
});

const StyledMenuToggle = styled(MenuToggle)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledDropdownList = styled(DropdownList)({
  paddingTop: 0,
  paddingBottom: 0,
  paddingInlineStart: 0,
});

const StyledDropdownItem = styled(DropdownItem)(({ theme }) => ({
  justifyContent: 'flex-start',
  textAlign: 'left',
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
}));

const StyledCardTitle = styled(CardTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
  flex: 1,
}));

const TitleText = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  borderRadius: 4,
  padding: '2px 6px',
  '&:hover': {
    backgroundColor:
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
});

const CardDivider = styled('div')(({ theme }) => ({
  borderTop: '1px solid var(--pf-t--global--border--color--default)',
  marginTop: theme.spacing(1),
}));

const StyledCardBody = styled(CardBody)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingTop: theme.spacing(2),
}));

const titleInputStyle: React.CSSProperties = {
  '--pf-v6-c-form-control--before--BorderStyle': 'none',
  '--pf-v6-c-form-control--after--BorderColor':
    'var(--pf-t--global--text--color--brand--default)',
  '--pf-v6-c-form-control--FontSize': '1.25rem',
  '--pf-v6-c-form-control--PaddingBlockStart': '2px',
  '--pf-v6-c-form-control--PaddingBlockEnd': '2px',
  '--pf-v6-c-form-control--PaddingInlineStart': '6px',
  '--pf-v6-c-form-control--PaddingInlineEnd': '6px',
  '--pf-v6-c-form-control--OutlineOffset': '0',
  width: '100%',
  minWidth: 0,
  fontWeight: 500,
} as React.CSSProperties;

export const NotebookCard = ({
  notebook,
  openNotebookMenuId,
  setOpenNotebookMenuId,
  onClick,
  onRename,
  onDelete,
  t,
}: NotebookCardProps) => {
  const isMenuOpen = openNotebookMenuId === notebook.session_id;

  const {
    isEditing,
    editValue: editName,
    setEditValue: setEditName,
    inputRef,
    startEditing,
    save: saveRename,
    handleKeyDown,
  } = useInlineEdit({
    currentName: notebook.name,
    onSave: newName => onRename(notebook.session_id, newName),
    onStart: () => setOpenNotebookMenuId(null),
  });

  const handleCardClick = useCallback(() => {
    if (!isEditing) {
      onClick(notebook);
    }
  }, [isEditing, onClick, notebook]);

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(notebook);
    }
  };

  return (
    <StyledCard
      component="div"
      tabIndex={0}
      aria-label={(t as Function)('notebooks.card.openAria', {
        name: notebook.name,
      })}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <StyledCardHeader
        actions={{
          actions: (
            <StyledDropdown
              isOpen={isMenuOpen}
              popperProps={{
                position: 'end',
                preventOverflow: true,
              }}
              onOpenChange={isOpen =>
                setOpenNotebookMenuId(isOpen ? notebook.session_id : null)
              }
              toggle={toggleRef => (
                <StyledMenuToggle
                  ref={toggleRef}
                  variant="plain"
                  aria-label={t('aria.options.label')}
                  isExpanded={isMenuOpen}
                  onClick={event => {
                    event.stopPropagation();
                    setOpenNotebookMenuId(current =>
                      current === notebook.session_id
                        ? null
                        : notebook.session_id,
                    );
                  }}
                >
                  <EllipsisVIcon />
                </StyledMenuToggle>
              )}
            >
              <StyledDropdownList>
                <StyledDropdownItem
                  icon={<PenIcon />}
                  onClick={event => {
                    event.stopPropagation();
                    startEditing();
                  }}
                >
                  {t('notebooks.actions.rename')}
                </StyledDropdownItem>
                <StyledDropdownItem
                  icon={<TrashIcon />}
                  onClick={event => {
                    event.stopPropagation();
                    onDelete(notebook.session_id);
                    setOpenNotebookMenuId(null);
                  }}
                >
                  {t('notebooks.actions.delete')}
                </StyledDropdownItem>
              </StyledDropdownList>
            </StyledDropdown>
          ),
        }}
      >
        <StyledCardTitle>
          <CatalogIcon />
          {isEditing ? (
            <TextInput
              ref={inputRef}
              style={titleInputStyle}
              value={editName}
              onChange={(_event, value) => setEditName(value)}
              onBlur={saveRename}
              onKeyDown={handleKeyDown}
              aria-label={t('notebooks.rename.inline.tooltip')}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <TitleText
              title={t('notebooks.rename.inline.tooltip')}
              onClick={e => {
                e.stopPropagation();
                startEditing();
              }}
            >
              {notebook.name}
            </TitleText>
          )}
        </StyledCardTitle>
      </StyledCardHeader>
      <CardDivider />
      <StyledCardBody>
        <div>
          <div>
            <Typography variant="body2" sx={{ pt: 1 }}>
              {(t as Function)('notebooks.documents', {
                count: notebook.document_count ?? 0,
              })}
            </Typography>
          </div>
          <div>
            <Typography
              variant="caption"
              sx={{ display: 'block', pb: 3, pt: 2, fontStyle: 'italic' }}
            >
              {formatUpdatedLabel(notebook.updated_at, t)}
            </Typography>
          </div>
        </div>
      </StyledCardBody>
    </StyledCard>
  );
};
