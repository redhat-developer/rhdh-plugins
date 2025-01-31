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
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@backstage/core-components';
import { HeaderLinkProps } from '../HeaderLinkComponent/HeaderLink';

/**
 * Menu item configuration
 *
 * @public
 */
export interface MenuItemConfig {
  Component: React.ComponentType<HeaderLinkProps | {}>;
  type: string;
  label: string;
  icon?: string;
  subLabel?: string;
  link?: string;
}

export interface MenuSectionConfig {
  sectionLabel?: string;
  optionalLink?: string;
  optionalLinkLabel?: string;
  items: MenuItemConfig[];
  hideDivider?: boolean;
  handleClose: () => void;
}

const MenuSection: React.FC<MenuSectionConfig> = ({
  sectionLabel,
  optionalLink,
  optionalLinkLabel,
  items,
  hideDivider = false,
  handleClose,
}) => (
  <Box>
    {sectionLabel && (
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
        <Typography variant="body2" sx={{ pl: 2, color: 'text.disabled' }}>
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
      {items.map(({ type, icon, label, subLabel, link, Component }, index) => (
        <MenuItem
          key={`menu-item-${index.toString()}`}
          disableRipple
          disableTouchRipple
          onClick={handleClose}
          sx={{ py: 0.5, '&:hover': { background: 'transparent' } }}
        >
          {link && (
            <Component
              icon={icon}
              to={link}
              title={label}
              subTitle={subLabel}
            />
          )}
          {type === 'logout' && <Component />}
        </MenuItem>
      ))}
    </ul>
    {!hideDivider && <Divider sx={{ my: 0.5 }} />}
  </Box>
);

export default MenuSection;
