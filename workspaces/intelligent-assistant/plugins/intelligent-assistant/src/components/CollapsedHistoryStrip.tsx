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

import { Button, Flex, FlexItem, Icon, Tooltip } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { SidebarExpandIcon } from './notebooks/SidebarCollapseIcon';

type CollapsedHistoryStripProps = {
  onExpand: () => void;
  onNewChat: () => void;
  newChatDisabled?: boolean;
};

/**
 * Collapsed chat-history rail for fullscreen. Stock PF plain icon buttons
 * (rounded-square hover) — no custom button chrome or vertical divider.
 */
export const CollapsedHistoryStrip = ({
  onExpand,
  onNewChat,
  newChatDisabled = false,
}: CollapsedHistoryStripProps) => {
  const { t } = useTranslation();

  return (
    <Flex
      direction={{ default: 'column' }}
      alignItems={{ default: 'alignItemsCenter' }}
      spaceItems={{ default: 'spaceItemsMd' }}
      flex={{ default: 'flexNone' }}
      style={{
        paddingBlockStart: 'var(--pf-t--global--spacer--md)',
        paddingInline: 'var(--pf-t--global--spacer--xs)',
        height: '100%',
      }}
    >
      <FlexItem>
        <Tooltip content={t('tooltip.expandHistoryPanel')} position="right">
          <Button
            variant="plain"
            icon={
              <Icon size="lg" isInline>
                <SidebarExpandIcon />
              </Icon>
            }
            // PF plain buttons paint :focus like :hover; skip mouse focus so
            // the chrome clears on pointer leave.
            onMouseDown={event => {
              if (event.button === 0) {
                event.preventDefault();
              }
            }}
            onClick={onExpand}
            aria-label={t('tooltip.expandHistoryPanel')}
          />
        </Tooltip>
      </FlexItem>
      <FlexItem>
        <Tooltip content={t('tooltip.quickNewChat')} position="right">
          <Button
            variant="plain"
            icon={
              <Icon isInline>
                <PencilAltIcon />
              </Icon>
            }
            onMouseDown={event => {
              if (event.button === 0) {
                event.preventDefault();
              }
            }}
            onClick={onNewChat}
            aria-label={t('tooltip.quickNewChat')}
            isDisabled={newChatDisabled}
          />
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};
