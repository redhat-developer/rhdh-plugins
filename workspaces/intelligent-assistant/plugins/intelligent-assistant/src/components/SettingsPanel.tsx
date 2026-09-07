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
import { createStyles, makeStyles } from '@material-ui/core';
import { Button, Title } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

import {
  SavedPrompt,
  SavedPromptsConfig,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import type { SettingsTab } from '../hooks/useSettingsPanelUrlState';
import { useTranslation } from '../hooks/useTranslation';
import { McpServersSettings } from './McpServersSettings';
import { SavedPromptsSettings } from './SavedPromptsSettings';

export type { SettingsTab };

type SettingsPanelProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
  backgroundColor?: string;
  isSavedPromptsEnabled: boolean;
  onEnableSavedPrompts: () => void;
  onApplySavedPromptToInput: (content: string) => void;
  onSendSavedPromptDirectly: (content: string) => void;
  isChatStreaming?: boolean;
  savedPrompts?: SavedPrompt[];
  savedPromptsConfig?: SavedPromptsConfig;
  savedPromptsLoading?: boolean;
  savedPromptsError?: string | null;
  onCreateSavedPrompt?: (name: string, content: string) => Promise<void>;
  onDeleteSavedPrompt?: (promptId: string) => Promise<void>;
};

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      backgroundColor:
        'var(--pf-t--global--background--color--floating--default)',
    },
    headerRow: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: `${theme.spacing(2)}px ${theme.spacing(2)}px ${theme.spacing(1)}px ${theme.spacing(3)}px`,
    },
    tabBar: {
      display: 'flex',
      padding: `0 ${theme.spacing(3)}px`,
      gap: theme.spacing(1),
      borderBottom: '1px solid var(--pf-t--global--border--color--default)',
    },
    tabButton: {
      background: 'none',
      border: 'none',
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
      fontSize: '0.875rem',
      cursor: 'pointer',
      color: theme.palette.text.secondary,
      borderBottom: '2px solid transparent',
      transition: 'color 0.15s, border-color 0.15s',
      '&:hover': {
        color: theme.palette.text.primary,
      },
    },
    tabButtonActive: {
      color: theme.palette.text.primary,
      fontWeight: 600,
      borderBottom: `2px solid var(--pf-t--global--color--brand--default, ${theme.palette.primary.main})`,
    },
    tabContent: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
    },
  }),
);

export const SettingsPanel = ({
  activeTab,
  onTabChange,
  onClose,
  backgroundColor,
  isSavedPromptsEnabled,
  onEnableSavedPrompts,
  onApplySavedPromptToInput,
  onSendSavedPromptDirectly,
  isChatStreaming = false,
  savedPrompts,
  savedPromptsConfig,
  savedPromptsLoading,
  savedPromptsError,
  onCreateSavedPrompt,
  onDeleteSavedPrompt,
}: SettingsPanelProps) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.headerRow}>
        <Title headingLevel="h2" size="xl">
          Settings
        </Title>
        <Button
          aria-label={t('mcp.settings.closeAriaLabel')}
          icon={<TimesIcon />}
          variant="plain"
          onClick={onClose}
        />
      </div>

      <div className={classes.tabBar}>
        <Button
          variant="plain"
          className={`${classes.tabButton} ${activeTab === 'mcp-servers' ? classes.tabButtonActive : ''}`}
          onClick={() => onTabChange('mcp-servers')}
        >
          {t('mcp.settings.title')}
        </Button>
        <Button
          variant="plain"
          className={`${classes.tabButton} ${activeTab === 'saved-prompts' ? classes.tabButtonActive : ''}`}
          onClick={() => onTabChange('saved-prompts')}
        >
          {t('savedPrompts.tab.title')}
        </Button>
      </div>

      <div className={classes.tabContent}>
        {activeTab === 'mcp-servers' && (
          <McpServersSettings
            onClose={onClose}
            backgroundColor={backgroundColor}
          />
        )}
        {activeTab === 'saved-prompts' && (
          <SavedPromptsSettings
            isSavedPromptsEnabled={isSavedPromptsEnabled}
            onEnableSavedPrompts={onEnableSavedPrompts}
            onApplyToInput={onApplySavedPromptToInput}
            onSendDirectly={onSendSavedPromptDirectly}
            isChatStreaming={isChatStreaming}
            savedPrompts={savedPrompts}
            savedPromptsConfig={savedPromptsConfig}
            savedPromptsLoading={savedPromptsLoading}
            savedPromptsError={savedPromptsError}
            onCreateSavedPrompt={onCreateSavedPrompt}
            onDeleteSavedPrompt={onDeleteSavedPrompt}
          />
        )}
      </div>
    </div>
  );
};
