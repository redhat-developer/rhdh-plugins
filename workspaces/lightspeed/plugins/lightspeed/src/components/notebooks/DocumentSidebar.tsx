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

import { makeStyles, Typography } from '@material-ui/core';
import { Button, Tooltip } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';

import { useTranslation } from '../../hooks/useTranslation';
import { SessionDocument } from '../../types';
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
    gap: theme.spacing(1),
    overflowY: 'auto',
    flex: 1,
  },
}));

type DocumentSidebarProps = {
  notebookName: string;
  documents: SessionDocument[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddDocument: () => void;
};

export const DocumentSidebar = ({
  notebookName,
  documents,
  collapsed,
  onToggleCollapse,
  onAddDocument,
}: DocumentSidebarProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  if (collapsed) {
    return null;
  }

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
            count: documents.length,
          } as any)}
        </Typography>
        <Button
          variant="link"
          className={classes.addButton}
          icon={<PlusCircleIcon />}
          onClick={onAddDocument}
        >
          {t('notebook.view.documents.add')}
        </Button>
      </div>

      {documents.length > 0 && (
        <div className={classes.documentsList}>
          {/* Document list items will be rendered here when documents exist */}
        </div>
      )}
    </div>
  );
};
