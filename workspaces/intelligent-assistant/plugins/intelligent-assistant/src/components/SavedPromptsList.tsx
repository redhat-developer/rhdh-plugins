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
import { Alert, Spinner } from '@patternfly/react-core';
import { makeStyles } from 'tss-react/mui';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { useTranslation } from '../hooks/useTranslation';
import { SavedPromptCard } from './SavedPromptCard';
import { SavedPromptKebabVariant } from './SavedPromptKebabMenu';

type SavedPromptsListProps = {
  prompts: SavedPrompt[];
  loading: boolean;
  error: string | null;
  variant?: SavedPromptKebabVariant;
  onApplyToInput?: (content: string) => void;
  onSendDirectly: (content: string) => void;
  onDelete: (prompt: SavedPrompt) => void;
  isSendDirectlyDisabled?: boolean;
};

const useStyles = makeStyles()(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
}));

export const SavedPromptsList = ({
  prompts,
  loading,
  error,
  variant = 'settings',
  onApplyToInput,
  onSendDirectly,
  onDelete,
  isSendDirectlyDisabled,
}: SavedPromptsListProps) => {
  const { classes } = useStyles();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={classes.loading} data-testid="saved-prompts-list-loading">
        <Spinner size="lg" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="danger"
        isInline
        title={error}
        data-testid="saved-prompts-list-error"
      />
    );
  }

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className={classes.root} data-testid="saved-prompts-list">
      {prompts.map((prompt, index) => (
        <SavedPromptCard
          key={prompt.id}
          prompt={prompt}
          variant={variant}
          showDivider={index < prompts.length - 1}
          onApplyToInput={onApplyToInput}
          onSendDirectly={onSendDirectly}
          onDelete={onDelete}
          isSendDirectlyDisabled={isSendDirectlyDisabled}
        />
      ))}
    </div>
  );
};
