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

import { Fragment } from 'react';
import type { ComponentType, FC } from 'react';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@backstage/core-components';
import { MenuItemLinkProps } from '../MenuItemLink/MenuItemLink';
import ListSubheader from '@mui/material/ListSubheader';

/**
 * Menu item configuration
 *
 * @public
 */
export interface MenuItemConfig {
  Component: ComponentType<MenuItemLinkProps | {}>;
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

export const MenuSection: FC<MenuSectionConfig> = ({
  sectionLabel,
  optionalLink,
  optionalLinkLabel,
  items,
  hideDivider = false,
  handleClose,
}) => {
  const hasClickableSubheader =
    optionalLink && optionalLinkLabel && items.length > 0;

  return (
    <>
      {sectionLabel && (
        <MenuItem
          sx={{
            p: 0,
          }}
          disableRipple
          disableTouchRipple
          component={hasClickableSubheader ? Link : Fragment}
          to={optionalLink}
          onClick={handleClose}
        >
          <ListSubheader
            sx={{
              backgroundColor: 'transparent',
              m: 0,
              color: 'text.disabled',
              lineHeight: 2,
              mt: '0.5rem',
              fontWeight: 400,
            }}
          >
            {sectionLabel}
          </ListSubheader>

          {optionalLinkLabel && (
            <Box
              sx={{
                fontSize: '0.875em',
                mr: 2,
                flexGrow: 1,
                textAlign: 'right',
                mt: '0.5rem',
              }}
            >
              {optionalLinkLabel}
            </Box>
          )}
        </MenuItem>
      )}

      {items.map(({ icon, label, subLabel, link, Component }, index) => (
        <MenuItem
          key={`menu-item-${index.toString()}`}
          disableRipple
          disableTouchRipple
          onClick={handleClose}
          sx={{ py: 0.5 }}
          component={link ? Link : Fragment}
          to={link}
        >
          <Component icon={icon} to={link!} title={label} subTitle={subLabel} />
        </MenuItem>
      ))}
      {!hideDivider && <Divider sx={{ my: 0.5 }} />}
    </>
  );
};
