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

import { styled } from '@mui/material/styles';
import { Button, Tooltip } from '@patternfly/react-core';
import { PenIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { SidebarExpandIcon } from './notebooks/SidebarCollapseIcon';

const StripRoot = styled('div')(({ theme }) => ({
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
}));

const StyledIconButton = styled(Button)({
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
});

const StyledNewChatButton = styled(Button)({
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
});

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
  const { t } = useTranslation();

  return (
    <StripRoot>
      <Tooltip content={t('tooltip.expandHistoryPanel')} position="right">
        <StyledIconButton
          variant="plain"
          onClick={onExpand}
          aria-label={t('tooltip.expandHistoryPanel')}
        >
          <SidebarExpandIcon />
        </StyledIconButton>
      </Tooltip>
      <Tooltip content={t('tooltip.quickNewChat')} position="right">
        <StyledNewChatButton
          variant="plain"
          onClick={onNewChat}
          aria-label={t('tooltip.quickNewChat')}
          isDisabled={newChatDisabled}
        >
          <PenIcon />
        </StyledNewChatButton>
      </Tooltip>
    </StripRoot>
  );
};
