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

import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FabIcon } from './FabIcon';
import { FloatingActionButton, Slot } from '../types';
import { getSlotOptions } from '../utils';
import { getTranslatedTextWithFallback } from '../utils/translationUtils';
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { globalFloatingActionButtonTranslationRef } from '../translations';

const useStyles = makeStyles(() => ({
  openInNew: { paddingBottom: '5px', paddingTop: '3px' },
}));

const FABLabel = ({
  label,
  slot,
  showExternalIcon,
  icon,
  order,
}: {
  label: string;
  slot: Slot;
  showExternalIcon: boolean;
  icon?: string | ReactElement;
  order: { externalIcon?: number; icon?: number };
}) => {
  const styles = useStyles();
  const marginStyle = getSlotOptions(slot).margin;
  return (
    <>
      {showExternalIcon && (
        <OpenInNewIcon
          className={styles.openInNew}
          sx={{ ...marginStyle, order: order.externalIcon }}
        />
      )}
      {label && (
        <Typography
          sx={{
            ...marginStyle,
            color: '#151515',
            order: 2,
            textTransform: 'none',
          }}
        >
          {label}
        </Typography>
      )}
      {icon && (
        <Typography sx={{ mb: -1, order: order.icon }}>
          <FabIcon icon={icon} />
        </Typography>
      )}
    </>
  );
};

export const CustomFab = ({
  actionButton,
  size,
  className,
  t,
}: {
  actionButton: FloatingActionButton;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  t: TranslationFunction<typeof globalFloatingActionButtonTranslationRef.T>;
}) => {
  const navigate = useNavigate();
  const isExternalUri = (uri: string) => /^([a-z+.-]+):/.test(uri);
  const isExternal = isExternalUri(actionButton.to!);
  const newWindow = isExternal && !!/^https?:/.exec(actionButton.to!);
  const navigateTo = () =>
    actionButton.to && !isExternal ? navigate(actionButton.to) : '';

  const resolvedLabel = getTranslatedTextWithFallback(
    t,
    actionButton.labelKey,
    actionButton.label,
  );
  const resolvedTooltip = actionButton.toolTip
    ? getTranslatedTextWithFallback(
        t,
        actionButton.toolTipKey,
        actionButton.toolTip,
      )
    : undefined;

  if (!resolvedLabel) {
    // eslint-disable-next-line no-console
    console.warn(
      'Label is missing from your FAB component. A label is required for the aria-label attribute.',
      actionButton,
    );
    return null;
  }

  const labelText =
    (resolvedLabel || '').length > 20
      ? `${resolvedLabel.slice(0, resolvedLabel.length)}...`
      : resolvedLabel;

  const getColor = () => {
    if (actionButton.color) {
      return actionButton.color;
    }
    return undefined;
  };

  const displayOnRight =
    actionButton.slot === Slot.PAGE_END || !actionButton.slot;

  return (
    <Tooltip
      title={resolvedTooltip}
      placement={getSlotOptions(actionButton.slot).tooltipDirection}
    >
      <Fab
        {...(newWindow ? { target: '_blank', rel: 'noopener' } : {})}
        className={className}
        style={{
          color: actionButton?.iconColor || '#1f1f1f',
          backgroundColor: actionButton.color ? '' : 'white',
        }}
        variant={
          actionButton.showLabel || isExternal || !actionButton.icon
            ? 'extended'
            : 'circular'
        }
        size={size || actionButton.size || 'medium'}
        color={getColor()}
        aria-label={resolvedLabel}
        data-testid={(resolvedLabel || '')
          .replace(' ', '-')
          .toLocaleLowerCase('en-US')}
        onClick={actionButton.onClick || navigateTo}
        {...(isExternal ? { href: actionButton.to } : {})}
      >
        <FABLabel
          showExternalIcon={isExternal}
          icon={actionButton.icon}
          label={actionButton.showLabel || !actionButton.icon ? labelText : ''}
          order={
            displayOnRight
              ? { externalIcon: isExternal ? 1 : -1, icon: 3 }
              : { externalIcon: isExternal ? 3 : -1, icon: 1 }
          }
          slot={actionButton.slot || Slot.PAGE_END}
        />
      </Fab>
    </Tooltip>
  );
};
