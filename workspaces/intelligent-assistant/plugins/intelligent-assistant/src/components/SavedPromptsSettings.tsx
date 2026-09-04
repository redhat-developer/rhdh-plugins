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
import { useCallback, useState } from 'react';

import { createStyles, makeStyles } from '@material-ui/core';
import {
  Alert,
  AlertActionLink,
  Button,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { useSavedPrompts } from '../hooks/useSavedPrompts';
import { useTranslation } from '../hooks/useTranslation';

type SavedPromptsSettingsProps = {
  isSavedPromptsEnabled: boolean;
  onEnableSavedPrompts: () => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px 24px',
      gap: '16px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      borderRadius: '8px',
    },
    formActions: {
      display: 'flex',
      gap: '8px',
    },
    promptCount: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--pf-t--global--border--color--default)',
      paddingBottom: '12px',
    },
  }),
);

export const SavedPromptsSettings = ({
  isSavedPromptsEnabled,
  onEnableSavedPrompts,
}: SavedPromptsSettingsProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { savedPrompts, config, createPrompt } = useSavedPrompts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const titleExceedsLimit = title.length > config.max_display_name_length;
  const contentExceedsLimit = content.length > config.max_content_length;
  const isFormValid =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    !titleExceedsLimit &&
    !contentExceedsLimit;
  const isLimitReached = savedPrompts.length >= config.max_prompts_per_user;

  const handleSave = useCallback(async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await createPrompt(title.trim(), content.trim());
      setTitle('');
      setContent('');
      setIsFormOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  }, [isFormValid, title, content, createPrompt]);

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setIsFormOpen(false);
    setSaveError(null);
  };

  return (
    <div className={classes.root}>
      {!isSavedPromptsEnabled && (
        <Alert
          variant="info"
          isInline
          title={t('savedPrompts.disabled.title')}
          actionLinks={
            <AlertActionLink onClick={onEnableSavedPrompts}>
              {t('savedPrompts.disabled.enableLink')}
            </AlertActionLink>
          }
        >
          {t('savedPrompts.disabled.body')}
        </Alert>
      )}

      <div className={classes.promptCount}>
        <span>
          {savedPrompts.length === 0
            ? t('savedPrompts.count.zero')
            : (t as Function)('savedPrompts.count', {
                count: savedPrompts.length,
              })}
        </span>
        <Button
          variant="secondary"
          size="sm"
          isDisabled={isLimitReached || isFormOpen}
          onClick={() => setIsFormOpen(true)}
          style={{ borderRadius: '999px' }}
        >
          {t('savedPrompts.newPrompt')}
        </Button>
      </div>

      {isLimitReached && (
        <Alert
          variant="warning"
          isInline
          isPlain
          title={t('savedPrompts.limitReached')}
        />
      )}

      {isFormOpen && (
        <div className={classes.form}>
          <FormGroup
            label={t('savedPrompts.form.titleLabel')}
            isRequired
            fieldId="saved-prompt-title"
          >
            <TextInput
              id="saved-prompt-title"
              value={title}
              onChange={(_event, value) => setTitle(value)}
              validated={titleExceedsLimit ? 'error' : 'default'}
              isRequired
            />
            {titleExceedsLimit && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {t('savedPrompts.validation.titleMaxLength', {
                      max: config.max_display_name_length,
                    } as any)}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup
            label={t('savedPrompts.form.contentLabel')}
            isRequired
            fieldId="saved-prompt-content"
          >
            <TextArea
              id="saved-prompt-content"
              value={content}
              onChange={(_event, value) => setContent(value)}
              validated={contentExceedsLimit ? 'error' : 'default'}
              isRequired
              rows={4}
              resizeOrientation="vertical"
            />
            {contentExceedsLimit && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {t('savedPrompts.validation.contentMaxLength', {
                      max: config.max_content_length,
                    } as any)}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          {saveError && (
            <Alert variant="danger" isInline isPlain title={saveError} />
          )}

          <div className={classes.formActions}>
            <Button
              variant="primary"
              size="sm"
              isDisabled={!isFormValid || isSaving}
              isLoading={isSaving}
              onClick={handleSave}
            >
              {t('savedPrompts.form.save')}
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={handleCancel}
              isDisabled={isSaving}
            >
              {t('savedPrompts.form.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
