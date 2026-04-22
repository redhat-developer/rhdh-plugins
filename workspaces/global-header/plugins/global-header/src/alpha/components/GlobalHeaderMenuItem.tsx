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

import { Link } from '@backstage/core-components';

import MenuItem from '@mui/material/MenuItem';

import { MenuItemLink } from '../../components/MenuItemLink/MenuItemLink';

/**
 * Props for {@link GlobalHeaderMenuItem}.
 *
 * @alpha
 */
export interface GlobalHeaderMenuItemProps {
  /** Navigation URL. When absent the item renders as a plain action button. */
  to?: string;
  /** Display title. */
  title?: string;
  /** Translation key for the title. */
  titleKey?: string;
  /** Secondary text rendered below the title. */
  subTitle?: string;
  /** Translation key for the secondary text. */
  subTitleKey?: string;
  /** Icon identifier passed to `HeaderIcon`. */
  icon?: string;
  /** Tooltip shown on hover. */
  tooltip?: string;
  /** Called when the item is clicked (typically the dropdown's `handleClose`). */
  onClick?: () => void;
}

/**
 * A complete, self-contained menu item for use inside header dropdowns.
 *
 * Renders a MUI `MenuItem` with optional `Link` navigation and the
 * standard `MenuItemLink` content (icon, title, subtitle, external
 * link indicator). Consumers only need this one component — no manual
 * `MenuItem` or `Link` wrapping required.
 *
 * @example
 * ```tsx
 * const MyHelpItem = ({ handleClose }) => (
 *   <GlobalHeaderMenuItem
 *     to="https://docs.example.com"
 *     title="Documentation"
 *     icon="menu_book"
 *     onClick={handleClose}
 *   />
 * );
 * ```
 *
 * @alpha
 */
export const GlobalHeaderMenuItem = ({
  to,
  title,
  titleKey,
  subTitle,
  subTitleKey,
  icon,
  tooltip,
  onClick,
}: GlobalHeaderMenuItemProps) => (
  <MenuItem
    disableRipple
    disableTouchRipple
    onClick={onClick}
    sx={{ py: 0.5, color: 'inherit', textDecoration: 'none' }}
    component={to ? Link : Fragment}
    to={to}
  >
    <MenuItemLink
      to={to ?? ''}
      title={title}
      titleKey={titleKey}
      subTitle={subTitle}
      subTitleKey={subTitleKey}
      icon={icon}
      tooltip={tooltip}
    />
  </MenuItem>
);
