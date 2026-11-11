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

import { Ref, useCallback, useRef, useState } from 'react';

import Divider from '@mui/material/Divider';
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
  Icon,
  Label,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {
  ExpandIcon,
  OpenDrawerRightIcon,
  OutlinedWindowRestoreIcon,
  RhUiEllipsisVerticalFillIcon,
} from '@patternfly/react-icons';

import { useCloseOnOutsidePointerDown } from '../hooks/useCloseOnOutsidePointerDown';
import { useTranslation } from '../hooks/useTranslation';
import { McpSettingsIcon } from './McpSettingsIcon';
import { ModelSelectorToggleText } from './ModelSelectorToggleText';

type LightspeedChatBoxHeaderProps = {
  displayMode: ChatbotDisplayMode;
  selectedModel: string;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string; provider: string }[];
  onSettingsClick: () => void;
  isModelSelectorDisabled?: boolean;
  hideModelSelector?: boolean;
  /** When false, omits Settings entry (Chat tab only). */
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

const SelectorToggle = styled(MenuToggle, {
  shouldForwardProp: prop => prop !== 'dimmed',
})<{ dimmed?: boolean }>(({ theme, dimmed }) => ({
  minWidth: 0,
  maxWidth: '100%',
  ...(dimmed && {
    backgroundColor: theme.palette.action.disabled,
  }),
  '& .pf-v6-c-menu-toggle__text, & .pf-v5-c-menu-toggle__text': {
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
}));

const StyledDropdownGroup = styled(DropdownGroup)({
  fontWeight: 'bold',
});

export const LightspeedChatBoxHeader = ({
  selectedModel,
  displayMode,
  handleSelectedModel,
  models,
  onSettingsClick,
  isModelSelectorDisabled = false,
  hideModelSelector = false,
  showChatTabOptions = true,
  setDisplayMode,
}: LightspeedChatBoxHeaderProps) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const modelSelectorRootRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const closeModelMenu = useCallback(() => setIsOptionsMenuOpen(false), []);

  useCloseOnOutsidePointerDown(
    isOptionsMenuOpen && !isModelSelectorDisabled && !hideModelSelector,
    closeModelMenu,
    modelSelectorRootRef,
  );

  const selectedModelLabel =
    models.find(m => m.value === selectedModel)?.label ?? selectedModel;
  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <SelectorToggle
      dimmed={isModelSelectorDisabled}
      variant="secondary"
      aria-label={t('aria.chatbotSelector')}
      ref={toggleRef}
      isExpanded={isOptionsMenuOpen}
      isDisabled={isModelSelectorDisabled}
      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
    >
      <ModelSelectorToggleText
        label={selectedModelLabel}
        hideTooltip={isOptionsMenuOpen}
      />
    </SelectorToggle>
  );

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
        <div ref={modelSelectorRootRef}>
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
        </div>
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
          className: 'pf-chatbot__button--toggle-options pf-m-compact',
          icon: (
            <Icon size="lg" isInline>
              <RhUiEllipsisVerticalFillIcon />
            </Icon>
          ),
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
                <DropdownItem
                  value="settings"
                  key="settings"
                  icon={<McpSettingsIcon />}
                  onClick={onSettingsClick}
                >
                  {t('settings.menu.label')}
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
