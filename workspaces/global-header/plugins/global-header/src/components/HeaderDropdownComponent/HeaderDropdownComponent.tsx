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

import { useId } from 'react';
import type { ReactNode, ComponentProps, MouseEvent, FC } from 'react';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { MenuItemConfig, MenuSectionConfig } from './MenuSection';

interface HeaderDropdownProps {
  buttonContent: ReactNode;
  children: ReactNode;
  menuSections?: MenuSectionConfig[];
  menuBottomItems?: MenuItemConfig[];
  buttonProps?: ComponentProps<typeof Button>;
  onOpen: (event: MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  isIconButton?: boolean;
  tooltip?: string;
  size?: IconButtonProps['size'];
}

const menuListStyle = (theme: Theme) => ({
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  padding: 0,
  margin: 0,
  minWidth: '160px',
  borderRadius: '4px',
  textDecoration: 'none',
  listStyle: 'none',
  overflow: 'auto',
  outline: '1px solid transparent',
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  color:
    theme.palette.mode === 'dark'
      ? theme.palette.text.disabled
      : theme.palette.text.primary,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 6px 2px rgba(0,0,0,0.50), 0 1px 2px 0 rgba(0,0,0,0.50)'
      : '0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)',
  maxHeight: '60vh',
  zIndex: 1,
});

export const HeaderDropdownComponent: FC<HeaderDropdownProps> = ({
  buttonContent,
  children,
  buttonProps,
  onOpen,
  onClose,
  anchorEl,
  isIconButton = false,
  size = 'small',
  tooltip,
}) => {
  const id = useId();

  const commonButtonProps = {
    ...buttonProps,
    onClick: (event: MouseEvent<HTMLElement>) => {
      onOpen(event);
      // focus the menu when opened
      // TODO: investigate why MUI isn't doing this for us
      setTimeout(() => {
        document
          .getElementById(`${id}-menu`)
          ?.getElementsByTagName('a')[0]
          ?.focus();
      }, 0);
    },
    'aria-haspopup': true,
    'aria-controls': id,
    'aria-expanded': anchorEl ? true : undefined,
  };

  return (
    <Box>
      <Tooltip title={tooltip}>
        {isIconButton ? (
          <IconButton {...commonButtonProps} color="inherit" size={size}>
            {buttonContent}
          </IconButton>
        ) : (
          <Button disableRipple disableTouchRipple {...commonButtonProps}>
            {buttonContent}
          </Button>
        )}
      </Tooltip>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& ul[class*="MuiMenu-list"]': {
            py: 0,
          },
        }}
        MenuListProps={{
          'aria-labelledby': id,
          sx: theme => menuListStyle(theme),
        }}
      >
        {children}
      </Menu>
    </Box>
  );
};
