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
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { MenuItemConfig, MenuSectionConfig } from './MenuSection';

interface HeaderDropdownProps {
  buttonContent: React.ReactNode;
  children: React.ReactNode;
  menuSections?: MenuSectionConfig[];
  menuBottomItems?: MenuItemConfig[];
  buttonProps?: React.ComponentProps<typeof Button>;
  onOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

const Listbox = styled('ul')(
  ({ theme }) => `
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  min-width: 160px;
  border-radius: 4px;
  text-decoration: none;
  list-style: none;
  overflow: auto;
  outline: 1;
  background: ${theme.palette.background.paper};
  border: 1px solid ${theme.palette.divider};
  color: ${
    theme.palette.mode === 'dark'
      ? theme.palette.text.disabled
      : theme.palette.text.primary
  };
  boxShadow: theme.palette.mode === 'dark'
    ? '0 2px 6px 2px rgba(0,0,0,0.50), 0 1px 2px 0 rgba(0,0,0,0.50)'
    : '0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)',
  max-height: 60vh;
  z-index: 1;
  `,
);

export const HeaderDropdownComponent: React.FC<HeaderDropdownProps> = ({
  buttonContent,
  children,
  buttonProps,
  onOpen,
  onClose,
  anchorEl,
}) => {
  return (
    <Box>
      <Button
        disableRipple
        disableTouchRipple
        {...buttonProps}
        onClick={onOpen}
      >
        {buttonContent}
      </Button>
      <Menu
        id="menu-appbar"
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
      >
        <Listbox role="menu">{children}</Listbox>
      </Menu>
    </Box>
  );
};
