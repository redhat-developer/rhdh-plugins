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

import { Fragment, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { keyframes, styled } from '@mui/material/styles';
import { Label, Tooltip } from '@patternfly/react-core';
import { PauseIcon } from '@patternfly/react-icons';

import { useScreenContextLabelRevision } from '../hooks/useScreenContextLabelRevision';
import { useTranslation } from '../hooks/useTranslation';
import {
  getScreenContextTooltipLine1Text,
  getScreenContextTooltipLine2Key,
  resolveScreenContextChipLabel,
  ScreenContextTooltipLine2Key,
  SOFTWARE_TEMPLATES_LIST_CHIP_LABEL,
} from '../utils/screen-context-utils';

export type ScreenContextChipState = 'recording' | 'paused' | 'unavailable';

/** Prototype max width; shorter labels shrink to content. */
const CHIP_MAX_WIDTH_PX = 150;
const CHIP_HEIGHT_PX = 24;

const pulse = keyframes`
  0% { opacity: 0.45; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.45; transform: scale(0.92); }
`;

const ChipWrap = styled('div')({
  display: 'inline-flex',
  height: CHIP_HEIGHT_PX,
  maxWidth: CHIP_MAX_WIDTH_PX,
  minWidth: 0,
  flexShrink: 0,
});

const FixedSizeChipLabel = styled(Label)({
  height: CHIP_HEIGHT_PX,
  maxWidth: CHIP_MAX_WIDTH_PX,
  width: 'max-content',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  '--pf-v6-c-label--PaddingBlockStart': '0',
  '--pf-v6-c-label--PaddingBlockEnd': '0',
  '--pf-v6-c-label--MinWidth': 'auto',
  '& .pf-v6-c-label__content': {
    maxWidth: '100%',
    height: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  '& .pf-v6-c-label__text': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
});

const RecordingDot = styled('span')({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: 'var(--pf-t--global--icon--color--status--danger--default)',
  animation: `${pulse} 1.4s ease-in-out infinite`,
});

const ChipText = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

const LINE2_I18N: Record<ScreenContextTooltipLine2Key, string> = {
  fullContext: 'contextChip.tooltip.line2.fullContext',
  adminLimited: 'contextChip.tooltip.line2.adminLimited',
  screenshotOnly: 'contextChip.tooltip.line2.screenshotOnly',
  domOffNoVision: 'contextChip.tooltip.line2.domOffNoVision',
  textOnlyNoVision: 'contextChip.tooltip.line2.textOnlyNoVision',
  textOnlyAdminScreenshotsOff:
    'contextChip.tooltip.line2.textOnlyAdminScreenshotsOff',
  textOnlyCombined: 'contextChip.tooltip.line2.textOnlyCombined',
};

export type ScreenContextChipProps = {
  state: ScreenContextChipState;
  chipLabel?: string;
  domEnabled: boolean;
  screenshotsEnabled: boolean;
  supportsVision: boolean;
  onTogglePaused?: () => void;
};

export const ScreenContextChip = ({
  state,
  chipLabel,
  domEnabled,
  screenshotsEnabled,
  supportsVision,
  onTogglePaused,
}: ScreenContextChipProps) => {
  const { t } = useTranslation();
  const routerLocation = useLocation();
  useScreenContextLabelRevision();

  const { label: resolvedLabel, routeKind } = resolveScreenContextChipLabel({
    pathname: routerLocation.pathname,
    search: routerLocation.search,
  });

  const label = chipLabel ?? resolvedLabel;
  const displayLabel =
    label === SOFTWARE_TEMPLATES_LIST_CHIP_LABEL
      ? t('contextChip.label.softwareTemplates')
      : label;

  const tooltipContent = useMemo(() => {
    if (state === 'unavailable') {
      return t('contextChip.tooltip.unavailable');
    }
    if (state === 'paused') {
      return t('contextChip.tooltip.paused');
    }

    const line1 = getScreenContextTooltipLine1Text(
      {
        chipLabel: displayLabel,
        routeKind,
        pathname: routerLocation.pathname,
      },
      (key, options) => t(key as any, options as any),
    );
    const line2Key = getScreenContextTooltipLine2Key({
      domEnabled,
      screenshotsEnabled,
      supportsVision,
    });
    const line2 = t(LINE2_I18N[line2Key] as any, {} as any);
    return (
      <Fragment>
        {line1}
        <br />
        {line2}
      </Fragment>
    );
  }, [
    state,
    displayLabel,
    routeKind,
    routerLocation.pathname,
    domEnabled,
    screenshotsEnabled,
    supportsVision,
    t,
  ]);

  if (state === 'unavailable') {
    return (
      <ChipWrap className="lightspeed-page-context-label lightspeed-page-context-label-unavailable">
        <Tooltip content={tooltipContent}>
          <FixedSizeChipLabel
            color="grey"
            variant="outline"
            isCompact
            className="lightspeed-context-chip-unavailable-label"
          >
            <ChipText>{t('contextChip.label.unavailable')}</ChipText>
          </FixedSizeChipLabel>
        </Tooltip>
      </ChipWrap>
    );
  }

  if (state === 'paused') {
    return (
      <ChipWrap className="lightspeed-page-context-label lightspeed-page-context-label-paused">
        <Tooltip content={tooltipContent}>
          <FixedSizeChipLabel
            color="grey"
            variant="outline"
            isCompact
            isClickable
            onClick={onTogglePaused}
            icon={<PauseIcon aria-hidden />}
            className="lightspeed-page-context-chip-clickable lightspeed-context-chip-paused-label"
            aria-label={t('contextChip.aria.resume')}
          >
            <ChipText>{t('contextChip.label.paused')}</ChipText>
          </FixedSizeChipLabel>
        </Tooltip>
      </ChipWrap>
    );
  }

  return (
    <ChipWrap className="lightspeed-page-context-label lightspeed-page-context-label-recording lightspeed-page-context-chip-clickable">
      <Tooltip content={tooltipContent}>
        <FixedSizeChipLabel
          color="red"
          variant="outline"
          isCompact
          isClickable
          onClick={onTogglePaused}
          icon={<RecordingDot aria-hidden />}
          className="lightspeed-context-chip-recording-label"
          aria-label={t('contextChip.aria.pause' as any, {
            label: displayLabel,
          })}
        >
          <ChipText>{displayLabel}</ChipText>
        </FixedSizeChipLabel>
      </Tooltip>
    </ChipWrap>
  );
};
