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
import { SvgIconProps } from '@mui/material/SvgIcon';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@backstage/core-components';
import MenuItemContent from './MenuItemContent';

export interface MenuItemBase {
  itemKey: string;
  icon?: React.ElementType<SvgIconProps>;
  label: string;
  subLabel?: string;
}

export interface MenuItemLink extends MenuItemBase {
  link: string;
  onClick?: never;
}

export interface MenuItemAction extends MenuItemBase {
  onClick: () => void;
  link?: never;
}

export type MenuItemConfig = MenuItemLink | MenuItemAction;

export interface MenuSectionConfig {
  sectionKey: string;
  sectionLabel?: string;
  optionalLink?: string;
  optionalLinkLabel?: string;
  items: MenuItemConfig[];
  hideDivider?: boolean;
  handleClose: () => void;
}

const MenuSection: React.FC<MenuSectionConfig> = ({
  sectionKey,
  sectionLabel,
  optionalLink,
  optionalLinkLabel,
  items,
  hideDivider = false,
  handleClose,
}) => (
  <Box>
    {sectionLabel && sectionKey && (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mx: 0,
          mt: '0.5rem',
          '&:hover': { background: 'transparent' },
        }}
      >
        <Typography
          variant="body2"
          sx={{ ml: 2, fontSize: '0.875em', color: 'text.disabled' }}
        >
          {sectionLabel}
        </Typography>
        <MenuItem
          sx={{
            '&:hover': { background: 'transparent' },
          }}
          disableRipple
          disableTouchRipple
          onClick={handleClose}
        >
          {optionalLink && optionalLinkLabel && (
            <Link
              to={optionalLink}
              underline="none"
              style={{ fontSize: '0.875em' }}
            >
              {optionalLinkLabel}
            </Link>
          )}
        </MenuItem>
      </Box>
    )}
    <ul style={{ padding: 0, listStyle: 'none' }}>
      {items.map(({ itemKey, icon: Icon, label, subLabel, link, onClick }) => (
        <MenuItem
          key={`menu-item-${itemKey}`}
          disableRipple
          disableTouchRipple
          onClick={handleClose}
          sx={{ py: 0.5, '&:hover': { background: 'transparent' } }}
        >
          {link ? (
            <Link
              to={link}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                width: '100%',
              }}
            >
              <MenuItemContent Icon={Icon} label={label} subLabel={subLabel} />
            </Link>
          ) : (
            <Box
              onClick={onClick}
              sx={{ cursor: 'pointer', width: '100%', color: 'inherit' }}
            >
              <MenuItemContent Icon={Icon} label={label} subLabel={subLabel} />
            </Box>
          )}
        </MenuItem>
      ))}
    </ul>
    {!hideDivider && <Divider sx={{ margin: '8px 0' }} />}
  </Box>
);

export default MenuSection;
