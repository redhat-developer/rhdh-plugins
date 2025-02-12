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

import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { HeaderIcon } from './HeaderIcon';
import { Link } from 'react-router-dom';
import { isExternalUrl } from '../../utils/stringUtils';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import { HeaderIconButtonProps } from '../../types';

export const HeaderIconButton = ({
  icon,
  tooltip,
  to,
}: HeaderIconButtonProps) => {
  const showNotifications = icon === 'notifications';
  const unreadCount = useNotificationCount(showNotifications);
  const isExternal = to && isExternalUrl(to);
  const buttonProps: Record<string, any> = {
    component: isExternal ? 'a' : Link,
  };

  if (to) {
    buttonProps[isExternal ? 'href' : 'to'] = to;
  }

  if (isExternal) {
    buttonProps.target = '_blank';
    buttonProps.rel = 'noopener noreferrer';
  }

  return (
    <Tooltip title={tooltip ?? icon}>
      <IconButton
        color="inherit"
        aria-label={tooltip ?? icon}
        sx={{ mr: 1.5 }}
        {...buttonProps}
      >
        {unreadCount > 0 ? (
          <Badge badgeContent={unreadCount} max={999} color="error">
            <HeaderIcon icon={icon} />
          </Badge>
        ) : (
          <HeaderIcon icon={icon} />
        )}
      </IconButton>
    </Tooltip>
  );
};
