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

import type { IconComponent } from '@backstage/frontend-plugin-api';
import {
  Link,
  SidebarItem,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import LaunchIcon from '@mui/icons-material/Launch';

import type { SidebarModelItem } from './buildSidebarModel';
import { resolveSidebarLinkAttributes } from './sidebarLinkAttributes';

function submenuItemRowSx(theme: Theme) {
  return {
    height: 48,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.navigation?.color,
    padding: theme.spacing(2.5),
    cursor: 'pointer',
    position: 'relative' as const,
    background: 'none',
    border: 'none',
    boxSizing: 'border-box' as const,
    '&:hover': {
      background:
        theme.palette.navigation?.navItem?.hoverBackground ?? '#6f6f6f',
      color: theme.palette.navigation?.selectedColor,
    },
  };
}

/** Top-level row: standard {@link SidebarItem} with optional `target`, `rel`, and icon. */
export function SidebarConfiguredItem({
  icon,
  text,
  item,
}: {
  icon: IconComponent;
  text: string;
  item: SidebarModelItem;
}) {
  if (!item.to) {
    return (
      <SidebarItem icon={icon} text={text} onClick={() => item.onClick?.()} />
    );
  }

  const link = resolveSidebarLinkAttributes(item.to, item.target);

  return (
    <SidebarItem
      icon={icon}
      text={text}
      to={item.to}
      onClick={item.onClick}
      {...(link.target ? { target: link.target } : {})}
      {...(link.rel ? { rel: link.rel } : {})}
    >
      {link.externalLinkIcon ? (
        <LaunchIcon fontSize="small" aria-hidden />
      ) : undefined}
    </SidebarItem>
  );
}

/** Submenu row: {@link SidebarSubmenuItem} when no configured target; else same layout with link props. */
export function SidebarConfiguredSubmenuItem({
  item,
  icon,
  title,
}: {
  item: SidebarModelItem;
  icon: IconComponent;
  title: string;
}) {
  const link = resolveSidebarLinkAttributes(item.to, item.target);
  if (!item.to || !link.target) {
    return <SidebarSubmenuItem title={title} to={item.to} icon={icon} />;
  }

  return (
    <SidebarSubmenuItemWithLink
      title={title}
      to={item.to}
      icon={icon}
      target={link.target}
      rel={link.rel}
      externalLinkIcon={link.externalLinkIcon}
    />
  );
}

/** Matches Backstage {@link SidebarSubmenuItem} styles; forwards `target` / `rel` / `externalLinkIcon`. */
function SidebarSubmenuItemWithLink({
  title,
  to,
  icon: Icon,
  target,
  rel,
  externalLinkIcon,
}: {
  title: string;
  to: string;
  icon: IconComponent;
  target: '_blank' | '_self';
  rel?: string;
  externalLinkIcon?: boolean;
}) {
  const theme = useTheme();
  const rowSx = submenuItemRowSx(theme);

  return (
    <Box sx={{ width: '100%' }}>
      <Tooltip title={title} enterDelay={500} enterNextDelay={500}>
        <Box sx={rowSx}>
          <Link
            to={to}
            target={target}
            {...(rel ? { rel } : {})}
            {...(externalLinkIcon ? { externalLinkIcon: true } : {})}
            underline="none"
            color="inherit"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {Icon && <Icon fontSize="small" />}
            <Typography
              variant="subtitle1"
              component="span"
              sx={{
                margin: theme.spacing(1.75),
                marginLeft: theme.spacing(1),
                fontSize: theme.typography.body2.fontSize,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.5,
              }}
            >
              {title}
            </Typography>
          </Link>
        </Box>
      </Tooltip>
    </Box>
  );
}
