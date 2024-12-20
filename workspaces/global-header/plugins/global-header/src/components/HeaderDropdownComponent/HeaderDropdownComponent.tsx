/*
 * Copyright 2024 The Backstage Authors
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
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link } from '@backstage/core-components';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MenuSection, { MenuItemConfig, MenuSectionConfig } from './MenuSection';

interface HeaderDropdownProps {
  buttonContent: React.ReactNode;
  menuSections?: MenuSectionConfig[];
  menuBottomItems?: MenuItemConfig[];
  buttonProps?: React.ComponentProps<typeof Button>;
  buttonClick?: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const Listbox = styled('ul')(
  ({ theme }) => `
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  min-width: 160px;
  border-radius: 3px;
  text-decoration: none;
  list-style: none;
  overflow: auto;
  outline: 1;
  background: ${
    theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff'
  };
  border: 1px solid ${
    theme.palette.mode === 'dark'
      ? theme.palette.divider
      : theme.palette.background.default
  };
  color: ${
    theme.palette.mode === 'dark'
      ? theme.palette.text.disabled
      : theme.palette.text.primary
  };
  box-shadow: 0 4px 6px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
  };
  z-index: 1;
  `,
);

const HeaderDropdownComponent: React.FC<HeaderDropdownProps> = ({
  buttonContent,
  menuSections = [],
  menuBottomItems = [],
  buttonProps,
  buttonClick,
  anchorEl,
  setAnchorEl,
}) => {
  const shouldHideDivider = (index: number) =>
    menuSections.length === 1 &&
    index === menuSections.length - 1 &&
    menuBottomItems.length === 0;

  return (
    <Box>
      <Button
        disableRipple
        disableTouchRipple
        {...buttonProps}
        onClick={buttonClick}
      >
        {buttonContent}
      </Button>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
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
        <Listbox role="menu">
          {menuSections.map((section, index) => (
            <MenuSection
              key={`menu-section-${section.sectionKey}`}
              {...{ hideDivider: shouldHideDivider(index), ...section }}
              handleClose={() => setAnchorEl(null)}
            />
          ))}
          {menuBottomItems.map(
            ({ itemKey, icon: Icon, label, subLabel, link }) => (
              <MenuItem
                key={`menu-item-${itemKey}`}
                sx={{ my: '8px', '&:hover': { background: 'transparent' } }}
                onClick={() => setAnchorEl(null)}
                disableRipple
              >
                {link && (
                  <Link
                    to={link}
                    style={{
                      display: 'flex',
                      color: 'inherit',
                      alignItems: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    {Icon && (
                      <Icon
                        fontSize="small"
                        style={{
                          marginRight: '0.5rem',
                          flexShrink: 0,
                          color: 'slategray',
                        }}
                      />
                    )}
                    <Box>
                      <Typography variant="body2">{label}</Typography>
                      {subLabel && (
                        <Typography variant="caption" color="text.secondary">
                          {subLabel}
                        </Typography>
                      )}
                    </Box>
                  </Link>
                )}
              </MenuItem>
            ),
          )}
        </Listbox>
      </Menu>
    </Box>
  );
};

export default HeaderDropdownComponent;
