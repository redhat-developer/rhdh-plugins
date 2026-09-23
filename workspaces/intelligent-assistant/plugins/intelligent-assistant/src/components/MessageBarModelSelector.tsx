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

import { Fragment, Ref, useEffect, useMemo, useState } from 'react';

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
import {
  AngleDownIcon,
  CheckIcon,
  OutlinedImageIcon,
} from '@patternfly/react-icons';

import { useTranslation } from '../hooks/useTranslation';

type MessageBarModelSelectorProps = {
  selectedModel: string;
  models: {
    label: string;
    value: string;
    provider: string;
    supportsVision?: boolean;
  }[];
  onSelect: (model: string) => void;
  disabled?: boolean;
  disabledTooltip?: string;
};

const SelectorToggle = styled(MenuToggle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
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
}));

const VisionIndicatorIcon = styled(OutlinedImageIcon)(({ theme }) => ({
  width: 16,
  height: 16,
  color: theme.palette.text.secondary,
  flexShrink: 0,
}));

const VisionIndicatorWrap = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  lineHeight: 1,
});

/** Fixed-width slot so vision icons align across rows (empty when unsupported). */
const VisionSlot = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 16,
  height: 16,
});

/** Fixed-width slot so the select tick aligns across rows (empty when not selected). */
const TickSlot = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '1em',
  height: '1em',
  color: theme.palette.primary.main,
}));

const ModelLabel = styled('span')({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const ModelItemContent = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  minWidth: 0,
});

const StyledDropdown = styled(Dropdown)({
  '& ul, & li': {
    padding: 0,
    margin: 0,
  },
  '& .pf-v6-c-menu__item-main': {
    width: '100%',
  },
  '& .pf-v6-c-menu__item-text': {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  },
  // We render our own fixed tick column; hide PF's conditional select icon.
  '& .pf-v6-c-menu__item-select-icon': {
    display: 'none',
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

  const visionScreenshotTooltip = useMemo(
    () => (
      <Fragment>
        {t('modelSelector.visionScreenshot.line1')}
        <br />
        {t('modelSelector.visionScreenshot.line2')}
      </Fragment>
    ),
    [t],
  );

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
        {models.map(model => {
          const isSelected = selectedModel === model.value;
          return (
            <DropdownItem
              value={model.value}
              key={model.value}
              isSelected={isSelected}
            >
              <ModelItemContent>
                <ModelLabel title={model.label}>{model.label}</ModelLabel>
                {model.supportsVision ? (
                  <VisionSlot className="lightspeed-model-vision-slot">
                    <Tooltip content={visionScreenshotTooltip}>
                      <VisionIndicatorWrap
                        aria-label={t(
                          'modelSelector.visionScreenshot.ariaLabel',
                        )}
                        onClick={event => event.stopPropagation()}
                        onMouseDown={event => event.stopPropagation()}
                      >
                        <VisionIndicatorIcon aria-hidden />
                      </VisionIndicatorWrap>
                    </Tooltip>
                  </VisionSlot>
                ) : (
                  <VisionSlot
                    className="lightspeed-model-vision-slot"
                    aria-hidden
                  />
                )}
                <TickSlot
                  className="lightspeed-model-tick-slot"
                  aria-hidden={!isSelected}
                >
                  {isSelected ? <CheckIcon aria-hidden /> : null}
                </TickSlot>
              </ModelItemContent>
            </DropdownItem>
          );
        })}
      </DropdownList>
    </StyledDropdown>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip content={disabledTooltip}>
        <Typography component="span">{dropdown}</Typography>
      </Tooltip>
    );
  }

  return dropdown;
};
