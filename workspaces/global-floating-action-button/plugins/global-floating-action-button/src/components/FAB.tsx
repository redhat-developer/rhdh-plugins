/*
 * Copyright 2025 The Backstage Authors
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
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { FabIcon } from './FabIcon';
import { FloatingActionButton, Slot } from '../types';

export const FAB = ({
  actionButton,
  size,
}: {
  actionButton: FloatingActionButton;
  size?: 'small' | 'medium' | 'large';
}) => {
  const navigate = useNavigate();
  const isExternalUri = (uri: string) => /^([a-z+.-]+):/.test(uri);
  const external = isExternalUri(actionButton.to!);
  const newWindow = external && !!/^https?:/.exec(actionButton.to!);
  const navigateTo = () =>
    actionButton.to && !external ? navigate(actionButton.to) : '';
  return (
    <Tooltip
      title={actionButton.toolTip}
      placement={Slot.PAGE_END ? 'left' : 'right'}
    >
      <div>
        <Fab
          {...(newWindow ? { target: '_blank', rel: 'noopener' } : {})}
          variant={
            actionButton.showLabel || !actionButton.icon
              ? 'extended'
              : 'circular'
          }
          size={size || actionButton.size || 'medium'}
          color={actionButton.color || 'default'}
          aria-label={actionButton.label}
          onClick={actionButton.onClick || navigateTo}
          {...(external ? { href: actionButton.to } : {})}
        >
          {actionButton.icon && <FabIcon icon={actionButton.icon} />}
          {(actionButton.showLabel || !actionButton.icon) && (
            <Typography sx={actionButton.icon ? { ml: 1 } : {}}>
              {actionButton.label}
            </Typography>
          )}
        </Fab>
      </div>
    </Tooltip>
  );
};
