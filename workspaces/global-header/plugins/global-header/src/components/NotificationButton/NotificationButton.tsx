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

import type { CSSProperties } from 'react';
import { Link as BackstageLink } from '@backstage/core-components';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';

import { useNotificationCount } from '../../hooks/useNotificationCount';

/**
 * @public
 */
export interface NotificationButtonProps {
  title?: string;
  tooltip?: string;
  color?:
    | 'inherit'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  size?: 'small' | 'medium' | 'large';
  badgeColor?:
    | 'primary'
    | 'secondary'
    | 'default'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  to?: string;
  layout?: CSSProperties;
}

// Backstage Link automatically detects external links and emits analytic events.
const Link = (props: any) => (
  <BackstageLink {...props} color="inherit" externalLinkIcon={false} />
);

/**
 * @public
 */
export const NotificationButton = ({
  title = 'Notifications',
  tooltip,
  color = 'inherit',
  size = 'small',
  badgeColor = 'error',
  to = '/notifications',
  layout,
}: NotificationButtonProps) => {
  const { available, unreadCount } = useNotificationCount();

  if (!available) {
    return null;
  }

  return (
    <Box sx={layout}>
      <Tooltip title={tooltip ?? title}>
        <div>
          <IconButton
            component={Link}
            color={color}
            size={size}
            to={to}
            aria-label={title}
          >
            {unreadCount > 0 ? (
              <Badge badgeContent={unreadCount} color={badgeColor} max={999}>
                <NotificationIcon fontSize={size} />
              </Badge>
            ) : (
              <NotificationIcon fontSize={size} />
            )}
          </IconButton>
        </div>
      </Tooltip>
    </Box>
  );
};
