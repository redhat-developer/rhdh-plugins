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

import { makeStyles } from '@material-ui/core';
import { Button, Tooltip } from '@patternfly/react-core';

import { useTranslation } from '../hooks/useTranslation';
import { SidebarExpandIcon } from './notebooks/SidebarCollapseIcon';

type IconProps = {
  className?: string;
};

export const EditSquareIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 512 512"
    fill="currentColor"
    aria-hidden="true"
    role="img"
    width="1em"
    height="1em"
    style={{ width: 16, height: 16 }}
  >
    <path d="M497.9 142.1l-46.1 46.1c-4.7 4.7-12.3 4.7-17 0l-111-111c-4.7-4.7-4.7-12.3 0-17l46.1-46.1c18.7-18.7 49.1-18.7 67.9 0l60.1 60.1c18.8 18.7 18.8 49.1 0 67.9zM284.2 99.8L21.6 362.4.4 483.9c-2.9 16.4 11.4 30.6 27.8 27.8l121.5-21.3 262.6-262.6c4.7-4.7 4.7-12.3 0-17l-111-111c-4.8-4.7-12.4-4.7-17.1 0zM124.1 339.9c-5.5-5.5-5.5-14.3 0-19.8l154-154c5.5-5.5 14.3-5.5 19.8 0s5.5 14.3 0 19.8l-154 154c-5.5 5.5-14.3 5.5-19.8 0zM88 424h48v36.3l-64.5 11.3-31.1-31.1L51.7 376H88v48z" />
  </svg>
);

const useStyles = makeStyles(theme => ({
  strip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1.5),
    borderRight: '1px solid var(--pf-t--global--border--color--default)',
    width: 48,
    minWidth: 48,
    flexShrink: 0,
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
    height: '100%',
  },
  iconButton: {
    padding: '8px !important',
    minWidth: 0,
    lineHeight: 1,
    borderRadius: '8px !important',
    border: '1px solid var(--pf-t--global--border--color--default) !important',
    color: 'var(--pf-t--global--icon--color--regular)',
    '& svg': {
      width: 18,
      height: 18,
    },
    '&:hover': {
      color: 'var(--pf-t--global--icon--color--hover) !important',
      backgroundColor:
        'var(--pf-t--global--background--color--action--plain--hover) !important',
    },
  },
  newChatIconButton: {
    padding: '8px !important',
    minWidth: 0,
    lineHeight: 1,
    borderRadius: '8px !important',
    border: '1px solid var(--pf-t--global--border--color--default) !important',
    color: 'var(--pf-t--global--color--brand--default)',
    '&:hover': {
      color: 'var(--pf-t--global--color--brand--hover) !important',
      backgroundColor:
        'var(--pf-t--global--background--color--action--plain--hover) !important',
    },
  },
}));

type CollapsedHistoryStripProps = {
  onExpand: () => void;
  onNewChat: () => void;
  newChatDisabled?: boolean;
};

export const CollapsedHistoryStrip = ({
  onExpand,
  onNewChat,
  newChatDisabled = false,
}: CollapsedHistoryStripProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.strip}>
      <Tooltip content={t('tooltip.expandHistoryPanel')} position="right">
        <Button
          variant="plain"
          className={classes.iconButton}
          onClick={onExpand}
          aria-label={t('tooltip.expandHistoryPanel')}
        >
          <SidebarExpandIcon />
        </Button>
      </Tooltip>
      <Tooltip content={t('tooltip.quickNewChat')} position="right">
        <Button
          variant="plain"
          className={classes.newChatIconButton}
          onClick={onNewChat}
          aria-label={t('tooltip.quickNewChat')}
          isDisabled={newChatDisabled}
        >
          <EditSquareIcon />
        </Button>
      </Tooltip>
    </div>
  );
};
