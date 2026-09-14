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

import { Ref, useEffect, useState } from 'react';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Tooltip,
} from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';
import {
  LIGHTSPEED_MESSAGE_BAR_MODEL_SELECTOR_CLASS,
  messageBarModelSelectorToggleCss,
} from './PlainIconButton';

type MessageBarModelSelectorProps = {
  selectedModel: string;
  models: { label: string; value: string; provider: string }[];
  onSelect: (model: string) => void;
  disabled?: boolean;
  disabledTooltip?: string;
};

const SelectorRoot = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  maxWidth: '100%',
});

const SelectorToggle = styled(MenuToggle)({
  '&&': messageBarModelSelectorToggleCss,
  color: 'var(--pf-t--global--text--color--subtle)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
});

const StyledDropdown = styled(Dropdown)({
  '& ul, & li': {
    padding: 0,
    margin: 0,
  },
});

export const MessageBarModelSelector = ({
  selectedModel,
  models,
  onSelect,
  disabled = false,
  disabledTooltip,
}: MessageBarModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const selectedModelLabel =
    models.find(m => m.value === selectedModel)?.label ?? selectedModel;

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <SelectorToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={disabled}
      variant="plain"
      aria-label={t('aria.chatbotSelector')}
    >
      {selectedModelLabel}
      <AngleDownIcon />
    </SelectorToggle>
  );

  const dropdown = (
    <StyledDropdown
      isOpen={isOpen && !disabled}
      onSelect={(_e, value) => {
        if (disabled) return;
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
    </StyledDropdown>
  );

  const content = (
    <SelectorRoot className={LIGHTSPEED_MESSAGE_BAR_MODEL_SELECTOR_CLASS}>
      {dropdown}
    </SelectorRoot>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip content={disabledTooltip}>
        <Typography component="span">{content}</Typography>
      </Tooltip>
    );
  }

  return content;
};
