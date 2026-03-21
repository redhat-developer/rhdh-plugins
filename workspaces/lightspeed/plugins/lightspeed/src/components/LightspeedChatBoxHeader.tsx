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
import SvgIcon from '@mui/material/SvgIcon';
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

type LightspeedChatBoxHeaderProps = {
  displayMode: ChatbotDisplayMode;
  selectedModel: string;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string; provider: string }[];
  isPinningChatsEnabled: boolean;
  onPinnedChatsToggle: (state: boolean) => void;
  onMcpSettingsClick: () => void;
  isModelSelectorDisabled?: boolean;
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
              icon={
                <SvgIcon
                  sx={{ marginTop: '8px' }}
                  viewBox="0 0 12 12"
                  fontSize="small"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.84399 1.17149C7.6024 0.936371 7.2786 0.804813 6.94149 0.804813C6.60437 0.804813 6.28057 0.936371 6.03899 1.17149L1.22599 5.89149C1.14544 5.96977 1.03755 6.01357 0.925236 6.01357C0.812918 6.01357 0.705027 5.96977 0.624485 5.89149C0.585054 5.85314 0.55371 5.80728 0.532308 5.75661C0.510905 5.70594 0.499878 5.65149 0.499878 5.59649C0.499878 5.54149 0.510905 5.48704 0.532308 5.43637C0.55371 5.3857 0.585054 5.33984 0.624485 5.30149L5.43749 0.581489C5.84009 0.189686 6.3797 -0.029541 6.94149 -0.029541C7.50327 -0.029541 8.04288 0.189686 8.44549 0.581489C8.67844 0.808041 8.85444 1.08654 8.95908 1.39418C9.06371 1.70183 9.09401 2.02988 9.04749 2.35149C9.37336 2.30514 9.70553 2.33423 10.0184 2.43653C10.3312 2.53882 10.6164 2.71158 10.852 2.94149L10.877 2.96649C11.0741 3.15823 11.2309 3.38755 11.3379 3.6409C11.4449 3.89424 11.5 4.16647 11.5 4.44149C11.5 4.71651 11.4449 4.98874 11.3379 5.24208C11.2309 5.49543 11.0741 5.72475 10.877 5.91649L6.52399 10.185C6.51085 10.1978 6.5004 10.213 6.49327 10.2299C6.48614 10.2468 6.48246 10.2649 6.48246 10.2832C6.48246 10.3016 6.48614 10.3197 6.49327 10.3366C6.5004 10.3534 6.51085 10.3687 6.52399 10.3815L7.41799 11.2585C7.45742 11.2968 7.48876 11.3427 7.51016 11.3934C7.53157 11.444 7.54259 11.4985 7.54259 11.5535C7.54259 11.6085 7.53157 11.6629 7.51016 11.7136C7.48876 11.7643 7.45742 11.8101 7.41799 11.8485C7.33744 11.9268 7.22955 11.9706 7.11724 11.9706C7.00492 11.9706 6.89703 11.9268 6.81649 11.8485L5.92249 10.972C5.83041 10.8825 5.75721 10.7755 5.70723 10.6572C5.65724 10.539 5.63149 10.4119 5.63149 10.2835C5.63149 10.1551 5.65724 10.028 5.70723 9.90975C5.75721 9.79149 5.83041 9.68446 5.92249 9.59499L10.2755 5.32599C10.3937 5.21091 10.4877 5.07331 10.5519 4.9213C10.616 4.7693 10.6491 4.60598 10.6491 4.44099C10.6491 4.276 10.616 4.11268 10.5519 3.96068C10.4877 3.80867 10.3937 3.67107 10.2755 3.55599L10.2505 3.53149C10.0092 3.29662 9.68579 3.16507 9.34904 3.16479C9.01229 3.16451 8.6887 3.29552 8.44699 3.52999L4.86099 7.04699L4.85999 7.04799L4.81099 7.09649C4.73042 7.17492 4.62242 7.21881 4.50999 7.21881C4.39755 7.21881 4.28955 7.17492 4.20899 7.09649C4.16955 7.05814 4.13821 7.01228 4.11681 6.96161C4.09541 6.91094 4.08438 6.85649 4.08438 6.80149C4.08438 6.74649 4.09541 6.69204 4.11681 6.64137C4.13821 6.5907 4.16955 6.54484 4.20899 6.50649L7.84549 2.93999C7.96339 2.82483 8.05706 2.68724 8.12096 2.53532C8.18486 2.38341 8.21771 2.22023 8.21757 2.05542C8.21743 1.89061 8.18431 1.7275 8.12014 1.57569C8.05598 1.42388 7.96209 1.28645 7.84399 1.17149Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.24248 2.35148C7.28192 2.31313 7.31326 2.26727 7.33466 2.2166C7.35606 2.16593 7.36709 2.11149 7.36709 2.05648C7.36709 2.00148 7.35606 1.94703 7.33466 1.89636C7.31326 1.84569 7.28192 1.79983 7.24248 1.76148C7.16192 1.68305 7.05392 1.63916 6.94148 1.63916C6.82905 1.63916 6.72105 1.68305 6.64048 1.76148L3.08098 5.25248C2.88383 5.44422 2.72711 5.67354 2.6201 5.92689C2.51308 6.18023 2.45795 6.45246 2.45795 6.72748C2.45795 7.0025 2.51308 7.27473 2.6201 7.52808C2.72711 7.78142 2.88383 8.01074 3.08098 8.20248C3.48365 8.59417 4.02324 8.81331 4.58498 8.81331C5.14673 8.81331 5.68632 8.59417 6.08898 8.20248L9.64898 4.71148C9.68842 4.67313 9.71976 4.62727 9.74116 4.5766C9.76256 4.52593 9.77359 4.47149 9.77359 4.41648C9.77359 4.36148 9.76256 4.30703 9.74116 4.25636C9.71976 4.20569 9.68842 4.15983 9.64898 4.12148C9.56842 4.04305 9.46042 3.99916 9.34798 3.99916C9.23555 3.99916 9.12755 4.04305 9.04698 4.12148L5.48748 7.61248C5.2459 7.8476 4.9221 7.97916 4.58498 7.97916C4.24787 7.97916 3.92407 7.8476 3.68248 7.61248C3.56425 7.4974 3.47028 7.3598 3.40611 7.2078C3.34194 7.05579 3.30888 6.89247 3.30888 6.72748C3.30888 6.56249 3.34194 6.39917 3.40611 6.24717C3.47028 6.09517 3.56425 5.95756 3.68248 5.84248L7.24248 2.35148Z"
                    fill="currentColor"
                  />
                </SvgIcon>
              }
              onClick={onMcpSettingsClick}
            >
              MCP settings
            </DropdownItem>
          </DropdownList>
        </DropdownGroup>
      </ChatbotHeaderOptionsDropdown>
    </ChatbotHeaderActions>
  );
};
