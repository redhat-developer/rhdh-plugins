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

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FabIcon } from './FabIcon';
import { FloatingActionButton, Slot } from '../types';
import { slotOptions } from '../utils';

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
  icon?: string | React.ReactElement;
  order: { externalIcon?: number; icon?: number };
}) => {
  const styles = useStyles();
  const marginStyle = slotOptions[slot].margin;
  return (
    <Typography sx={{ display: 'flex' }}>
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
    </Typography>
  );
};

export const FAB = ({
  actionButton,
  size,
  className,
}: {
  actionButton: FloatingActionButton;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) => {
  const navigate = useNavigate();
  const isExternalUri = (uri: string) => /^([a-z+.-]+):/.test(uri);
  const isExternal = isExternalUri(actionButton.to!);
  const newWindow = isExternal && !!/^https?:/.exec(actionButton.to!);
  const navigateTo = () =>
    actionButton.to && !isExternal ? navigate(actionButton.to) : '';

  if (!actionButton.label) {
    // eslint-disable-next-line no-console
    console.warn(
      'Label is missing from your FAB component. A label is required for the aria-label attribute.',
      actionButton,
    );
    return null;
  }

  const labelText =
    (actionButton.label || '').length > 20
      ? `${actionButton.label.slice(0, actionButton.label.length)}...`
      : actionButton.label;

  const getColor = () => {
    if (actionButton.color) {
      return actionButton.color;
    }
    if (!className) {
      return 'info';
    }
    return undefined;
  };

  const displayOnRight =
    actionButton.slot === Slot.PAGE_END || !actionButton.slot;

  return (
    <Tooltip
      title={actionButton.toolTip}
      placement={
        slotOptions[actionButton.slot || Slot.PAGE_END].tooltipDirection
      }
    >
      <div className={className}>
        <Fab
          {...(newWindow ? { target: '_blank', rel: 'noopener' } : {})}
          style={{ color: '#1f1f1f' }}
          variant={
            actionButton.showLabel || isExternal || !actionButton.icon
              ? 'extended'
              : 'circular'
          }
          size={size || actionButton.size || 'medium'}
          color={getColor()}
          aria-label={actionButton.label}
          data-testid={(actionButton.label || '')
            .replace(' ', '-')
            .toLocaleLowerCase('en-US')}
          onClick={actionButton.onClick || navigateTo}
          {...(isExternal ? { href: actionButton.to } : {})}
        >
          <FABLabel
            showExternalIcon={isExternal}
            icon={actionButton.icon}
            label={
              actionButton.showLabel || !actionButton.icon ? labelText : ''
            }
            order={
              displayOnRight
                ? { externalIcon: isExternal ? 1 : -1, icon: 3 }
                : { externalIcon: isExternal ? 3 : -1, icon: 1 }
            }
            slot={actionButton.slot || Slot.PAGE_END}
          />
        </Fab>
      </div>
    </Tooltip>
  );
};
