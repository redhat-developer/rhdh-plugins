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

type IconProps = {
  className?: string;
};

const ExpandPanelIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9 21V3H11V21H9ZM13 17V7L18 12L13 17Z" fill="currentColor" />
  </svg>
);

export const EditSquareIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle' }}
  >
    <path
      d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H14L12 5H5V19H19V12L21 10V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM16.175 5.775L17.6 7.2L12 12.8V14H13.2L18.8 8.4L20.225 9.825L14.275 15.775C14.1083 15.9417 13.9167 16.0667 13.7 16.15C13.4833 16.2333 13.2583 16.275 13.025 16.275H11C10.7167 16.275 10.4792 16.1792 10.2875 15.9875C10.0958 15.7958 10 15.5583 10 15.275V13.25C10 13.0167 10.0417 12.7917 10.125 12.575C10.2083 12.3583 10.3333 12.1667 10.5 12L16.175 5.775ZM20.225 9.825L16.175 5.775L18.175 3.775C18.5583 3.39167 19.0292 3.2 19.5875 3.2C20.1458 3.2 20.6167 3.39167 21 3.775L22.225 5C22.6083 5.38333 22.8 5.85417 22.8 6.4125C22.8 6.97083 22.6083 7.44167 22.225 7.825L20.225 9.825Z"
      fill="currentColor"
    />
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
    padding: 0,
    minWidth: 0,
    lineHeight: 1,
    color: 'var(--pf-t--global--icon--color--regular)',
    '&:hover': {
      color: 'var(--pf-t--global--icon--color--hover)',
    },
  },
  newChatIconButton: {
    padding: 0,
    minWidth: 0,
    lineHeight: 1,
    color: '#0066CC',
    '&:hover': {
      color: 'var(--pf-t--global--color--brand--hover)',
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
          <ExpandPanelIcon />
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
