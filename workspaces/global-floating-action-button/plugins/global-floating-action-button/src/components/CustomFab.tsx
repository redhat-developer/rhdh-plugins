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

const isExternalUri = (uri: string) => /^([a-z+.-]+):/.test(uri);

const getIconOrder = (displayOnRight: boolean, isExternal: boolean) =>
  displayOnRight
    ? { externalIcon: isExternal ? 1 : -1, icon: 3 }
    : { externalIcon: isExternal ? 3 : -1, icon: 1 };

const getFabVariant = (
  showLabel?: boolean,
  isExternal?: boolean,
  icon?: string | ReactElement,
): 'extended' | 'circular' =>
  showLabel || isExternal || !icon ? 'extended' : 'circular';

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

  const isExternal = actionButton.to ? isExternalUri(actionButton.to) : false;
  const newWindow = isExternal && /^https?:/.test(actionButton.to || '');

  const navigateTo = () => {
    if (actionButton.to && !isExternal) {
      navigate(actionButton.to);
    }
  };

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

  const resolvedDisabledTooltip = actionButton.disabledToolTip
    ? getTranslatedTextWithFallback(
        t,
        actionButton.disabledToolTipKey,
        actionButton.disabledToolTip,
      )
    : undefined;

  const currentTooltip = actionButton.isDisabled
    ? resolvedDisabledTooltip
    : resolvedTooltip;

  if (!resolvedLabel) {
    // eslint-disable-next-line no-console
    console.warn(
      'Label is missing from your FAB component. A label is required for the aria-label attribute.',
      actionButton,
    );
    return null;
  }

  const labelText =
    resolvedLabel.length > 20
      ? `${resolvedLabel.slice(0, resolvedLabel.length)}...`
      : resolvedLabel;

  const displayOnRight =
    actionButton.slot === Slot.PAGE_END || !actionButton.slot;

  const slot = actionButton.slot || Slot.PAGE_END;
  const displayLabel =
    actionButton.showLabel || !actionButton.icon ? labelText : '';

  const fabElement = (
    <Fab
      {...(newWindow ? { target: '_blank', rel: 'noopener' } : {})}
      className={className}
      style={{
        color: actionButton.iconColor || '#1f1f1f',
        backgroundColor: actionButton.color ? '' : 'white',
      }}
      variant={getFabVariant(
        actionButton.showLabel,
        isExternal,
        actionButton.icon,
      )}
      size={size || actionButton.size || 'medium'}
      color={actionButton.color}
      aria-label={resolvedLabel}
      data-testid={resolvedLabel.replace(' ', '-').toLocaleLowerCase('en-US')}
      onClick={actionButton.onClick || navigateTo}
      disabled={actionButton.isDisabled}
      {...(isExternal ? { href: actionButton.to } : {})}
    >
      <FABLabel
        showExternalIcon={isExternal}
        icon={actionButton.icon}
        label={displayLabel}
        order={getIconOrder(displayOnRight, isExternal)}
        slot={slot}
      />
    </Fab>
  );

  return (
    <Tooltip
      title={currentTooltip}
      placement={getSlotOptions(actionButton.slot).tooltipDirection}
    >
      {fabElement}
    </Tooltip>
  );
};
