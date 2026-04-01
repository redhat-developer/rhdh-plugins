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

import { Typography } from '@material-ui/core';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons';

import { lightspeedTranslationRef } from '../../translations/ref';
import { NotebookSession } from '../../types';
import { NotebookCard } from './NotebookCard';

type NotebooksTabProps = {
  notebooks: NotebookSession[];
  hasNotebooks: boolean;
  classes: Record<string, string>;
  openNotebookMenuId: string | null;
  setOpenNotebookMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onRename: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  t: TranslationFunction<typeof lightspeedTranslationRef.T>;
  getDocumentsCount: (documentIds?: string[]) => number;
};

export const NotebooksTab = ({
  notebooks,
  hasNotebooks,
  classes,
  openNotebookMenuId,
  setOpenNotebookMenuId,
  onRename,
  onDelete,
  t,
  getDocumentsCount,
}: NotebooksTabProps) => (
  <div className={classes.notebooksContainer}>
    <div className={classes.notebooksHeader}>
      <Typography variant="h6" className={classes.notebooksHeading}>
        {t('notebooks.title')}
      </Typography>
      {hasNotebooks && (
        <Button
          variant="primary"
          className={classes.notebooksAction}
          icon={<PlusCircleIcon />}
        >
          {t('notebooks.empty.action')}
        </Button>
      )}
    </div>
    {!hasNotebooks ? (
      <div className={classes.notebooksEmptyState}>
        <CatalogIcon className={classes.notebooksIcon} />
        <Typography variant="h6" className={classes.notebooksHeadingEmpty}>
          {t('notebooks.empty.title')}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className={classes.notebooksDescription}
        >
          {t('notebooks.empty.description')}
        </Typography>
        <Button variant="primary" className={classes.notebooksActionEmpty}>
          {t('notebooks.empty.action')}
        </Button>
      </div>
    ) : (
      <div className={classes.notebooksGrid}>
        {notebooks.map(notebook => (
          <NotebookCard
            key={notebook.session_id}
            notebook={notebook}
            classes={classes}
            openNotebookMenuId={openNotebookMenuId}
            setOpenNotebookMenuId={setOpenNotebookMenuId}
            onRename={onRename}
            onDelete={onDelete}
            t={t}
            getDocumentsCount={getDocumentsCount}
          />
        ))}
      </div>
    )}
  </div>
);
