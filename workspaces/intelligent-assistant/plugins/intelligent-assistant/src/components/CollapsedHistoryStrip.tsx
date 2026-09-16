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
import { PencilAltIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { SidebarExpandIcon } from './notebooks/SidebarCollapseIcon';

const floatingBg = 'var(--pf-t--global--background--color--floating--default)';

const Strip = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
  width: 56,
  minWidth: 56,
  flexShrink: 0,
  backgroundColor: floatingBg,
  height: '100%',
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
  const { t } = useTranslation();

  return (
    <Strip>
      <Tooltip content={t('tooltip.expandHistoryPanel')} position="right">
        <Button
          variant="plain"
          onClick={onExpand}
          aria-label={t('tooltip.expandHistoryPanel')}
        >
          <SidebarExpandIcon size={18} />
        </Button>
      </Tooltip>
      <Tooltip content={t('tooltip.quickNewChat')} position="right">
        <Button
          variant="plain"
          onClick={onNewChat}
          aria-label={t('tooltip.quickNewChat')}
          isDisabled={newChatDisabled}
          style={
            newChatDisabled
              ? undefined
              : { color: 'var(--pf-t--global--color--brand--default)' }
          }
        >
          <PencilAltIcon style={{ width: 18, height: 18, display: 'block' }} />
        </Button>
      </Tooltip>
    </Strip>
  );
};
