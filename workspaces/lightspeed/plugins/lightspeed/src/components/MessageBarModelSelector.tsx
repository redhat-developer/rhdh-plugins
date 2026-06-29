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

import { makeStyles } from '@material-ui/core';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';

import { useTranslation } from '../hooks/useTranslation';

type MessageBarModelSelectorProps = {
  selectedModel: string;
  models: { label: string; value: string; provider: string }[];
  onSelect: (model: string) => void;
  disabled?: boolean;
};

const useStyles = makeStyles(theme => ({
  selectorToggle: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    // PF v6 dual-mapped icons render default + rh-ui SVGs; hide rh-ui so only
    // one caret shows (matches prototype toggle-icon structure).
    '& .pf-v6-c-menu-toggle__toggle-icon .pf-v6-icon-rh-ui': {
      display: 'none',
    },
  },
  dropdown: {
    '& ul, & li': {
      padding: 0,
      margin: 0,
    },
  },
}));

export const MessageBarModelSelector = ({
  selectedModel,
  models,
  onSelect,
  disabled = false,
}: MessageBarModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const classes = useStyles();
  const { t } = useTranslation();

  const selectedModelLabel =
    models.find(m => m.value === selectedModel)?.label ?? selectedModel;

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={disabled}
      variant="plainText"
      className={classes.selectorToggle}
      aria-label={t('aria.chatbotSelector')}
    >
      {selectedModelLabel}
    </MenuToggle>
  );

  return (
    <Dropdown
      className={classes.dropdown}
      isOpen={isOpen}
      onSelect={(_e, value) => {
        onSelect(value as string);
        setIsOpen(false);
      }}
      onOpenChange={open => setIsOpen(open)}
      popperProps={{ position: 'left' }}
      shouldFocusToggleOnSelect
      shouldFocusFirstItemOnOpen={false}
      toggle={toggle}
      isScrollable={models.length > 10}
      maxMenuHeight={models.length > 10 ? '240px' : undefined}
    >
      <DropdownList>
        {models.map(model => (
          <DropdownItem
            value={model.value}
            key={model.value}
            isSelected={selectedModel === model.value}
          >
            {model.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};
