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

import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import Divider from '@mui/material/Divider';
import GlobalStyles from '@mui/material/GlobalStyles';
import { styled } from '@mui/material/styles';
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
  Label,
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

const StyledDropdown = styled(Dropdown)({
  '& ul, & li': {
    padding: 0,
    margin: 0,
  },
});

const StyledOptionsDropdown = styled(ChatbotHeaderOptionsDropdown)({
  '& ul, & li': {
    padding: 0,
    margin: 0,
  },
});

// ChatbotHeaderOptionsDropdown spreads toggleProps.className over its own
// `pf-chatbot__button--toggle-options` classes, so keep those here. PF then
// rotates the vertical ellipsis 90deg, which clips away in the compact button.
const OPTIONS_TOGGLE_CLASS = 'ia-chat-options-toggle';

const SelectorToggle = styled(MenuToggle, {
  shouldForwardProp: prop => prop !== 'dimmed',
})<{ dimmed?: boolean }>(({ theme, dimmed }) => ({
  ...(dimmed && {
    backgroundColor: theme.palette.action.disabled,
  }),
}));

const StyledDropdownGroup = styled(DropdownGroup)({
  fontWeight: 'bold',
});

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

  const maxLabelLength = Math.max(
    ...models.map(m => m.label.length),
    selectedModel.length,
    1,
  );
  const toggleMinWidth = `${maxLabelLength + 4}ch`;

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <SelectorToggle
      dimmed={isModelSelectorDisabled}
      variant="secondary"
      aria-label={t('aria.chatbotSelector')}
      ref={toggleRef}
      isExpanded={isOptionsMenuOpen}
      isDisabled={isModelSelectorDisabled}
      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
      style={{ minWidth: toggleMinWidth }}
    >
      {selectedModel}
    </SelectorToggle>
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
      <GlobalStyles
        styles={{
          [`.${OPTIONS_TOGGLE_CLASS}`]: {
            overflow: 'visible',
            '& svg': {
              transform: 'none !important',
            },
          },
        }}
      />
      {!hideModelSelector && (
        <StyledDropdown
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
              <StyledDropdownGroup key={model.label}>
                <DropdownItem
                  value={model.value}
                  key={model.value}
                  isSelected={selectedModel === model.value}
                >
                  {model.label}
                </DropdownItem>
              </StyledDropdownGroup>
            ))}
          </DropdownList>
        </StyledDropdown>
      )}
      <StyledOptionsDropdown
        isCompact
        shouldFocusFirstItemOnOpen={false}
        popperProps={{
          position: 'right',
          preventOverflow: true,
          appendTo: () => document.body,
        }}
        toggleProps={{
          'aria-label': t('aria.options.label'),
          className: `pf-chatbot__button--toggle-options pf-m-compact ${OPTIONS_TOGGLE_CLASS}`,
        }}
        tooltipProps={{
          trigger: 'manual',
          content: '',
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
                  <Label color="purple" isCompact style={{ marginLeft: 8 }}>
                    {t('settings.mcp.badge')}
                  </Label>
                </DropdownItem>
              </DropdownList>
            </DropdownGroup>
          </>
        )}
      </StyledOptionsDropdown>
    </ChatbotHeaderActions>
  );
};
