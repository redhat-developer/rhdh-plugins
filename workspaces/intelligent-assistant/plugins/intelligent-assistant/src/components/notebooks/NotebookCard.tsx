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
} from '@patternfly/react-core';
import {
  CatalogIcon,
  EllipsisVIcon,
  PenIcon,
  TrashIcon,
} from '@patternfly/react-icons';

import { intelligentAssistantTranslationRef } from '../../translations/ref';
import { NotebookSession } from '../../types';
import { formatUpdatedLabel } from '../../utils/notebooks-utils';

type NotebookCardProps = {
  notebook: NotebookSession;
  classes: Record<string, string>;
  openNotebookMenuId: string | null;
  setOpenNotebookMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onClick: (notebook: NotebookSession) => void;
  onRename: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  t: TranslationFunction<typeof intelligentAssistantTranslationRef.T>;
};

export const NotebookCard = ({
  notebook,
  classes,
  openNotebookMenuId,
  setOpenNotebookMenuId,
  onClick,
  onRename,
  onDelete,
  t,
}: NotebookCardProps) => {
  const isMenuOpen = openNotebookMenuId === notebook.session_id;

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(notebook);
    }
  };

  const count = notebook.document_count ?? 0;
  const getDocumentCountText = () => {
    if (count === 0) return t('notebooks.documents.none');
    if (count === 1) return t('notebooks.documents.one');
    return (t as Function)('notebooks.documents.other', { count });
  };
  const documentCountText = getDocumentCountText();

  return (
    <Card
      className={classes.notebookCard}
      component="div"
      tabIndex={0}
      aria-label={(t as Function)('notebooks.card.openAria', {
        name: notebook.name,
      })}
      onClick={() => onClick(notebook)}
      onKeyDown={handleCardKeyDown}
    >
      <CardHeader
        className={classes.notebookCardHeader}
        actions={{
          actions: (
            <Dropdown
              className={classes.notebookDropdownMenu}
              isOpen={isMenuOpen}
              popperProps={{
                position: 'end',
                preventOverflow: true,
              }}
              onOpenChange={isOpen =>
                setOpenNotebookMenuId(isOpen ? notebook.session_id : null)
              }
              toggle={toggleRef => (
                <MenuToggle
                  ref={toggleRef}
                  variant="plain"
                  className={classes.notebookMenuButton}
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
                </MenuToggle>
              )}
            >
              <DropdownList className={classes.notebookDropdownList}>
                <DropdownItem
                  className={classes.notebookDropdownItem}
                  icon={<PenIcon />}
                  onClick={event => {
                    event.stopPropagation();
                    onRename(notebook.session_id);
                    setOpenNotebookMenuId(null);
                  }}
                >
                  {t('notebooks.actions.rename')}
                </DropdownItem>
                <DropdownItem
                  className={classes.notebookDropdownItem}
                  icon={<TrashIcon />}
                  onClick={event => {
                    event.stopPropagation();
                    onDelete(notebook.session_id);
                    setOpenNotebookMenuId(null);
                  }}
                >
                  {t('notebooks.actions.delete')}
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          ),
          className: classes.notebookCardHeaderActions,
        }}
      >
        <CardTitle className={classes.notebookTitle}>
          <CatalogIcon />
          <Typography component="span" className={classes.notebookTitleText}>
            {notebook.name}
          </Typography>
        </CardTitle>
      </CardHeader>
      <div className={classes.notebookCardDivider} />
      <CardBody className={classes.notebookCardBody}>
        <div>
          <div className={classes.notebookDocuments}>
            <Typography variant="body2">{documentCountText}</Typography>
          </div>
          <div className={classes.notebookUpdated}>
            <Typography variant="caption">
              {formatUpdatedLabel(notebook.updated_at, t)}
            </Typography>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
