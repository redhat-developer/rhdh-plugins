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

import { Ref, useState } from 'react';

import { createStyles, makeStyles } from '@material-ui/core';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import Divider from '@mui/material/Divider';
import {
  ChatbotDisplayMode,
  ChatbotHeaderActions,
  ChatbotHeaderOptionsDropdown,
} from '@patternfly/chatbot';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {
  ExpandIcon,
  OpenDrawerRightIcon,
  OutlinedWindowRestoreIcon,
} from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import { McpSettingsIcon } from './McpSettingsIcon';

type LightspeedChatBoxHeaderProps = {
  displayMode: ChatbotDisplayMode;
  selectedModel: string;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string; provider: string }[];
  isPinningChatsEnabled: boolean;
  onPinnedChatsToggle: (state: boolean) => void;
  onMcpSettingsClick: () => void;
  isModelSelectorDisabled?: boolean;
  hideModelSelector?: boolean;
  /** When false, omits pinned-chats and MCP entries (Chat tab only). */
  showChatTabOptions?: boolean;
  setDisplayMode: (mode: ChatbotDisplayMode) => void;
};

const useStyles = makeStyles(theme =>
  createStyles({
    dropdown: {
      '& ul, & li': {
        padding: 0,
        margin: 0,
      },
    },
    header: {
      backgroundColor: theme.palette.action.disabled,
    },
    optionsToggle: {
      '& svg': {
        transform: 'none !important',
      },
    },
    groupTitle: {
      fontWeight: 'bold',
    },
  }),
);

export const LightspeedChatBoxHeader = ({
  selectedModel,
  displayMode,
  handleSelectedModel,
  models,
  isPinningChatsEnabled,
  onPinnedChatsToggle,
  onMcpSettingsClick,
  isModelSelectorDisabled = false,
  hideModelSelector = false,
  showChatTabOptions = true,
  setDisplayMode,
}: LightspeedChatBoxHeaderProps) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const styles = useStyles();

  const maxLabelLength = Math.max(
    ...models.map(m => m.label.length),
    selectedModel.length,
    1,
  );
  const toggleMinWidth = `${maxLabelLength + 4}ch`;

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      className={isModelSelectorDisabled ? styles.header : ''}
      variant="secondary"
      aria-label={t('aria.chatbotSelector')}
      ref={toggleRef}
      isExpanded={isOptionsMenuOpen}
      isDisabled={isModelSelectorDisabled}
      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
      style={{ minWidth: toggleMinWidth }}
    >
      {selectedModel}
    </MenuToggle>
  );

  const handlePinningChatsToggle = (state: boolean) => {
    onPinnedChatsToggle(state);
  };

  const handleDockedToWindow = () => {
    setDisplayMode(ChatbotDisplayMode.docked);
  };

  const handleFullscreen = () => {
    setDisplayMode(ChatbotDisplayMode.embedded);
  };

  const handleOverlay = () => {
    setDisplayMode(ChatbotDisplayMode.default);
  };

  const isOverlayMode = displayMode === ChatbotDisplayMode.default;
  const scrollThreshold = isOverlayMode ? 8 : 10;
  const isModelDropdownScrollable = models.length > scrollThreshold;

  return (
    <ChatbotHeaderActions>
      {!hideModelSelector && (
        <Dropdown
          className={styles.dropdown}
          isOpen={isOptionsMenuOpen}
          onSelect={(_e, value) => {
            handleSelectedModel(value as string);
            setIsOptionsMenuOpen(false);
          }}
          onOpenChange={isOpen => setIsOptionsMenuOpen(isOpen)}
          popperProps={{ position: 'right' }}
          shouldFocusToggleOnSelect
          shouldFocusFirstItemOnOpen={false}
          toggle={toggle}
          isScrollable={isModelDropdownScrollable}
          maxMenuHeight={isModelDropdownScrollable ? '240px' : undefined}
        >
          <DropdownList>
            {models.map(model => (
              <DropdownGroup className={styles.groupTitle} key={model.label}>
                <DropdownItem
                  value={model.value}
                  key={model.value}
                  isSelected={selectedModel === model.value}
                >
                  {model.label}
                </DropdownItem>
              </DropdownGroup>
            ))}
          </DropdownList>
        </Dropdown>
      )}
      <ChatbotHeaderOptionsDropdown
        isCompact
        toggleProps={{
          'aria-label': t('aria.settings.label'),
          className: styles.optionsToggle,
        }}
        tooltipProps={{
          content: t('tooltip.settings'),
        }}
      >
        <DropdownGroup>
          <DropdownList>
            <DropdownItem key="displayModeLabel" isDisabled>
              {t('settings.displayMode.label')}
            </DropdownItem>
            <DropdownItem
              value={ChatbotDisplayMode.default}
              key="switchDisplayOverlay"
              icon={<OutlinedWindowRestoreIcon />}
              onClick={handleOverlay}
              isSelected={displayMode === ChatbotDisplayMode.default}
            >
              {t('settings.displayMode.overlay')}
            </DropdownItem>
            <DropdownItem
              value={ChatbotDisplayMode.docked}
              key="switchDisplayDock"
              icon={<OpenDrawerRightIcon />}
              onClick={handleDockedToWindow}
              isSelected={displayMode === ChatbotDisplayMode.docked}
            >
              {t('settings.displayMode.docked')}
            </DropdownItem>
            <DropdownItem
              value={ChatbotDisplayMode.embedded}
              key="switchDisplayFullscreen"
              icon={<ExpandIcon />}
              onClick={handleFullscreen}
              isSelected={displayMode === ChatbotDisplayMode.embedded}
            >
              {t('settings.displayMode.fullscreen')}
            </DropdownItem>
          </DropdownList>
        </DropdownGroup>
        {showChatTabOptions && (
          <>
            <Divider />
            <DropdownGroup>
              <DropdownList>
                {isPinningChatsEnabled ? (
                  <DropdownItem
                    value="disablePinningChats"
                    key="disablePinningChat"
                    icon={<ToggleOnOutlinedIcon sx={{ marginTop: '8px' }} />}
                    description={t('settings.pinned.enabled.description')}
                    onClick={() => handlePinningChatsToggle(false)}
                  >
                    {t('settings.pinned.disable')}
                  </DropdownItem>
                ) : (
                  <DropdownItem
                    value="enablePinningChats"
                    key="enablePinningChats"
                    icon={<ToggleOffOutlinedIcon sx={{ marginTop: '8px' }} />}
                    description={t('settings.pinned.disabled.description')}
                    onClick={() => handlePinningChatsToggle(true)}
                  >
                    {t('settings.pinned.enable')}
                  </DropdownItem>
                )}
                <DropdownItem
                  value="mcpSettings"
                  key="mcpSettings"
                  icon={<McpSettingsIcon />}
                  onClick={onMcpSettingsClick}
                >
                  {t('settings.mcp.label')}
                </DropdownItem>
              </DropdownList>
            </DropdownGroup>
          </>
        )}
      </ChatbotHeaderOptionsDropdown>
    </ChatbotHeaderActions>
  );
};
