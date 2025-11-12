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

import { Ref, useMemo, useState } from 'react';

import { createStyles, makeStyles } from '@material-ui/core';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import {
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

import { useTranslation } from '../hooks/useTranslation';

type LightspeedChatBoxHeaderProps = {
  selectedModel: string;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string; provider: string }[];
  isPinningChatsEnabled: boolean;
  onPinnedChatsToggle: (state: boolean) => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    dropdown: {
      '& ul, & li': {
        padding: 0,
        margin: 0,
      },
    },
    optionsToggle: {
      '& svg': {
        transform: 'none !important',
      },
    },
  }),
);

export const LightspeedChatBoxHeader = ({
  selectedModel,
  handleSelectedModel,
  models,
  isPinningChatsEnabled,
  onPinnedChatsToggle,
}: LightspeedChatBoxHeaderProps) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const styles = useStyles();

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: {
      [key: string]: { label: string; value: string; provider: string }[];
    } = {};

    models.forEach(model => {
      const provider = model.provider || t('chatbox.provider.other');
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });

    return groups;
  }, [models, t]);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      variant="secondary"
      aria-label={t('aria.chatbotSelector')}
      ref={toggleRef}
      isExpanded={isOptionsMenuOpen}
      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
    >
      {selectedModel}
    </MenuToggle>
  );

  const handlePinningChatsToggle = (state: boolean) => {
    onPinnedChatsToggle(state);
  };

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
      >
        <DropdownList>
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <DropdownGroup key={provider} label={provider}>
              {providerModels.map(model => (
                <DropdownItem value={model.value} key={model.value}>
                  {model.label}
                </DropdownItem>
              ))}
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
          </DropdownList>
        </DropdownGroup>
      </ChatbotHeaderOptionsDropdown>
    </ChatbotHeaderActions>
  );
};
