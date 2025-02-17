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
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { HeaderIcon } from '../HeaderIcon/HeaderIcon';
import { useTheme } from '@mui/material/styles';

interface MenuItemLinkContentProps {
  icon?: string;
  label?: string;
  subLabel?: string;
}

export const MenuItemLinkContent: React.FC<MenuItemLinkContentProps> = ({
  icon,
  label,
  subLabel,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        margin: '8px 0',
        color: 'inherit',
      }}
    >
      {icon && (
        <HeaderIcon
          icon={icon}
          size="small"
          layout={
            label
              ? {
                  marginRight: '0.5rem',
                  flexShrink: 0,
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.text.primary
                      : theme.palette.text.disabled,
                }
              : {}
          }
        />
      )}
      <Box>
        {label && (
          <Typography variant="body2" color={theme.palette.text.primary}>
            {label}
          </Typography>
        )}
        {subLabel && (
          <Typography variant="caption" color="text.secondary">
            {subLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
