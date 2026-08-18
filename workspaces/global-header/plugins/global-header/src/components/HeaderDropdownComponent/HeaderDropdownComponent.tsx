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
import type { ReactNode, ComponentProps, MouseEvent, FC, Ref } from 'react';
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
  /** Ref forwarded to the underlying MUI MenuList (`<ul>`). */
  menuListRef?: Ref<HTMLUListElement | null>;
}

const paperStyle = (theme: Theme) => ({
  borderRadius: '4px',
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 6px 2px rgba(0,0,0,0.50), 0 1px 2px 0 rgba(0,0,0,0.50)'
      : '0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)',
  maxHeight: '60vh',
  overflow: 'auto',
});

const menuListStyle = (theme: Theme) => ({
  fontSize: '0.875rem',
  padding: 0,
  margin: 0,
  minWidth: '160px',
  textDecoration: 'none',
  listStyle: 'none',
  color:
    theme.palette.mode === 'dark'
      ? theme.palette.text.disabled
      : theme.palette.text.primary,
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
  menuListRef,
}) => {
  const id = useId();

  const menuId = `${id}-menu`;

  const commonButtonProps = {
    ...buttonProps,
    onClick: (event: MouseEvent<HTMLElement>) => {
      onOpen(event);
      // Defer focus until MUI finishes rendering the menu into the DOM.
      setTimeout(() => {
        document
          .getElementById(menuId)
          ?.querySelector<HTMLElement>('[role="menuitem"]')
          ?.focus();
      }, 0);
    },
    'aria-haspopup': true,
    'aria-controls': menuId,
    'aria-expanded': anchorEl ? true : undefined,
    'aria-label': tooltip,
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
        id={menuId}
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
        slotProps={{
          paper: {
            sx: theme => paperStyle(theme as Theme),
          },
        }}
        sx={{
          '& ul[class*="MuiMenu-list"]': {
            py: 0,
          },
        }}
        MenuListProps={{
          ref: menuListRef as Ref<HTMLUListElement>,
          'aria-labelledby': id,
          sx: theme => menuListStyle(theme),
        }}
      >
        {children}
      </Menu>
    </Box>
  );
};
