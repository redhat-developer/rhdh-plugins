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
import { useState } from 'react';

import { Dropdown, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisHIcon } from '@patternfly/react-icons';
import { makeStyles } from 'tss-react/mui';

import { SavedPrompt } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { useTranslation } from '../hooks/useTranslation';
import { SavedPromptMenuItems } from './SavedPromptMenuItems';

export type SavedPromptKebabVariant = 'settings' | 'sidebar';

type SavedPromptKebabMenuProps = {
  prompt: SavedPrompt;
  variant: SavedPromptKebabVariant;
  onApplyToInput?: (content: string) => void;
  onSendDirectly: (content: string) => void;
  onDelete: (prompt: SavedPrompt) => void;
  isSendDirectlyDisabled?: boolean;
};

const useStyles = makeStyles()(() => ({
  menuButton: {
    padding: 4,
  },
}));

export const SavedPromptKebabMenu = ({
  prompt,
  variant,
  onApplyToInput,
  onSendDirectly,
  onDelete,
  isSendDirectlyDisabled = false,
}: SavedPromptKebabMenuProps) => {
  const { classes } = useStyles();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <Dropdown
      isOpen={isOpen}
      popperProps={{
        position: 'end',
        preventOverflow: true,
      }}
      onOpenChange={setIsOpen}
      toggle={toggleRef => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          className={classes.menuButton}
          aria-label={t('savedPrompts.actions.menuAriaLabel' as any, {
            name: prompt.name,
          })}
          isExpanded={isOpen}
          onClick={event => {
            event.stopPropagation();
            setIsOpen(current => !current);
          }}
        >
          <EllipsisHIcon />
        </MenuToggle>
      )}
    >
      <DropdownList style={{ paddingInlineStart: 0 }}>
        <SavedPromptMenuItems
          prompt={prompt}
          variant={variant}
          onApplyToInput={onApplyToInput}
          onSendDirectly={onSendDirectly}
          onDelete={onDelete}
          isSendDirectlyDisabled={isSendDirectlyDisabled}
          closeMenu={closeMenu}
        />
      </DropdownList>
    </Dropdown>
  );
};
