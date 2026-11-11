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
import { Switch } from '@patternfly/react-core';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';

export type PreferencesSettingsProps = {
  isPinningChatsEnabled: boolean;
  onPinnedChatsToggle: (enabled: boolean) => void;
  isSavedPromptsEnabled: boolean;
  onSavedPromptsToggle: (enabled: boolean) => void;
  screenContextAdminEnabled?: boolean;
  isScreenContextSharingEnabled?: boolean;
  onScreenContextSharingToggle?: (enabled: boolean) => void;
};

const useStyles = makeStyles()(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  description: {
    margin: 0,
    marginLeft: 0,
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    maxWidth: '36rem',
  },
}));

export const PreferencesSettings = ({
  isPinningChatsEnabled,
  onPinnedChatsToggle,
  isSavedPromptsEnabled,
  onSavedPromptsToggle,
  screenContextAdminEnabled = false,
  isScreenContextSharingEnabled = false,
  onScreenContextSharingToggle,
}: PreferencesSettingsProps) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  return (
    <div className={classes.root} data-testid="preferences-settings">
      <div className={classes.row}>
        <Switch
          id="preferences-pinned-chats"
          label={t('settings.preferences.pinnedChats.label')}
          isChecked={isPinningChatsEnabled}
          onChange={(_event, checked) => onPinnedChatsToggle(checked)}
        />
        <p className={classes.description}>
          {t('settings.preferences.pinnedChats.description')}
        </p>
      </div>

      <div className={classes.row}>
        <Switch
          id="preferences-saved-prompts"
          label={t('settings.preferences.savedPrompts.label')}
          isChecked={isSavedPromptsEnabled}
          onChange={(_event, checked) => onSavedPromptsToggle(checked)}
        />
        <p className={classes.description}>
          {t('settings.preferences.savedPrompts.description')}
        </p>
      </div>

      {screenContextAdminEnabled && (
        <div className={classes.row}>
          <Switch
            id="preferences-screen-context"
            label={t('settings.preferences.screenContext.label')}
            isChecked={isScreenContextSharingEnabled}
            onChange={(_event, checked) =>
              onScreenContextSharingToggle?.(checked)
            }
          />
          <p className={classes.description}>
            {t('settings.preferences.screenContext.description')}
          </p>
        </div>
      )}
    </div>
  );
};
