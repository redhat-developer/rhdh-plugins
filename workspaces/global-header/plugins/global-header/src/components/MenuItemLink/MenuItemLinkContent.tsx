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
import type { FC } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { HeaderIcon } from '../HeaderIcon/HeaderIcon';
import { useTheme } from '@mui/material/styles';
import LaunchIcon from '@mui/icons-material/Launch';

interface MenuItemLinkContentProps {
  icon?: string;
  label?: string;
  subLabel?: string;
  isExternalLink?: boolean;
}

export const MenuItemLinkContent: FC<MenuItemLinkContentProps> = ({
  icon,
  label,
  subLabel,
  isExternalLink = false,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '8px 0',
        color: 'inherit',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <HeaderIcon
            icon={icon}
            size="small"
            layout={
              label
                ? {
                    marginRight: '0.5rem',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center', // Ensure the icon is centered
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.text.primary
                        : theme.palette.text.disabled,
                  }
                : {}
            }
          />
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {label && (
            <Typography variant="body2" color={theme.palette.text.primary}>
              {label}
            </Typography>
          )}
          {subLabel && (
            <Typography variant="caption" color={theme.palette.text.secondary}>
              {subLabel}
            </Typography>
          )}
        </Box>
      </Box>
      {isExternalLink && (
        <LaunchIcon
          sx={{
            fontSize: 16,
            color: theme.palette.text.secondary,
            ml: 1,
          }}
        />
      )}
    </Box>
  );
};
