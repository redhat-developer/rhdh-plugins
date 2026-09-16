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
import { MouseEvent } from 'react';

import { DropdownItem } from '@patternfly/react-core';
import {
  ArrowRightIcon,
  PaperPlaneIcon,
  TrashIcon,
} from '@patternfly/react-icons';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { useTranslation } from '../hooks/useTranslation';
import { SavedPromptKebabVariant } from './SavedPromptKebabMenu';

type SavedPromptMenuItemsProps = {
  prompt: SavedPrompt;
  variant: SavedPromptKebabVariant;
  onApplyToInput?: (content: string) => void;
  onSendDirectly: (content: string) => void;
  onDelete: (prompt: SavedPrompt) => void;
  isSendDirectlyDisabled?: boolean;
  closeMenu?: () => void;
};

export const SavedPromptMenuItems = ({
  prompt,
  variant,
  onApplyToInput,
  onSendDirectly,
  onDelete,
  isSendDirectlyDisabled = false,
  closeMenu,
}: SavedPromptMenuItemsProps) => {
  const { t } = useTranslation();

  const handleAction = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
    closeMenu?.();
  };

  return (
    <>
      {variant === 'settings' && onApplyToInput && (
        <DropdownItem
          icon={<ArrowRightIcon />}
          onClick={handleAction(() => onApplyToInput(prompt.content))}
        >
          {t('savedPrompts.actions.apply')}
        </DropdownItem>
      )}
      <DropdownItem
        icon={<PaperPlaneIcon />}
        isDisabled={isSendDirectlyDisabled}
        description={
          isSendDirectlyDisabled
            ? t('savedPrompts.actions.sendDisabledStreaming')
            : undefined
        }
        onClick={handleAction(() => onSendDirectly(prompt.content))}
      >
        {t('savedPrompts.actions.send')}
      </DropdownItem>
      <DropdownItem
        icon={<TrashIcon />}
        onClick={handleAction(() => onDelete(prompt))}
      >
        {t('savedPrompts.actions.delete')}
      </DropdownItem>
    </>
  );
};
