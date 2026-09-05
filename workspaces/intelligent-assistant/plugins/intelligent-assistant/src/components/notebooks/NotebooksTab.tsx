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

import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Button } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons';

import { intelligentAssistantTranslationRef } from '../../translations/ref';
import { NotebookSession } from '../../types';
import { NotebookCard } from './NotebookCard';

const Container = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  backgroundColor: 'var(--pf-t--global--background--color--floating--default)',
}));

const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(4),
}));

const Heading = styled(Typography)({
  marginBottom: 0,
  whiteSpace: 'nowrap',
  fontSize: '1.25rem',
});

const EmptyHeading = styled(Typography)(({ theme }) => ({
  '&&': {
    marginBottom: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

const EmptyState = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
});

const EmptyIcon = styled(CatalogIcon)(({ theme }) => ({
  fontSize: 48,
  color: 'var(--pf-t--global--icon--color--subtle)',
  marginBottom: theme.spacing(1.5),
  '& > .pf-v6-icon-rh-ui': {
    display: 'none !important',
  },
}));

const Description = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(3),
  maxWidth: 420,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 999,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
}));

const EmptyActionButton = styled(ActionButton)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const Grid = styled('div', {
  shouldForwardProp: prop => prop !== 'isCompact',
})<{ isCompact?: boolean }>(({ theme, isCompact }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  width: '100%',
  maxWidth: '100%',
  ...(isCompact
    ? {
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        paddingBottom: theme.spacing(6),
      }
    : {
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        paddingBottom: theme.spacing(3),
        [theme.breakpoints.down('md')]: {
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        },
      }),
}));

type NotebooksTabProps = {
  notebooks: NotebookSession[];
  hasNotebooks: boolean;
  isCompact?: boolean;
  openNotebookMenuId: string | null;
  setOpenNotebookMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onSelectNotebook: (notebook: NotebookSession) => void;
  onRename: (sessionId: string, newName: string) => void;
  onDelete: (sessionId: string) => void;
  onCreateNotebook: () => void;
  t: TranslationFunction<typeof intelligentAssistantTranslationRef.T>;
};

export const NotebooksTab = ({
  notebooks,
  hasNotebooks,
  isCompact = false,
  openNotebookMenuId,
  setOpenNotebookMenuId,
  onSelectNotebook,
  onRename,
  onDelete,
  onCreateNotebook,
  t,
}: NotebooksTabProps) => (
  <Container>
    <Header>
      <Heading variant="h6">{t('notebooks.title')}</Heading>
      {hasNotebooks && (
        <ActionButton
          variant="primary"
          icon={<AddCircleOIcon />}
          onClick={onCreateNotebook}
        >
          {t('notebooks.empty.action')}
        </ActionButton>
      )}
    </Header>
    {!hasNotebooks ? (
      <EmptyState>
        <EmptyIcon />
        <EmptyHeading variant="h6">{t('notebooks.empty.title')}</EmptyHeading>
        <Description variant="body2" color="text.secondary">
          {t('notebooks.empty.description')}
        </Description>
        <EmptyActionButton variant="primary" onClick={onCreateNotebook}>
          {t('notebooks.empty.action')}
        </EmptyActionButton>
      </EmptyState>
    ) : (
      <Grid isCompact={isCompact}>
        {notebooks.map(notebook => (
          <NotebookCard
            key={notebook.session_id}
            notebook={notebook}
            openNotebookMenuId={openNotebookMenuId}
            setOpenNotebookMenuId={setOpenNotebookMenuId}
            onClick={onSelectNotebook}
            onRename={onRename}
            onDelete={onDelete}
            t={t}
          />
        ))}
      </Grid>
    )}
  </Container>
);
