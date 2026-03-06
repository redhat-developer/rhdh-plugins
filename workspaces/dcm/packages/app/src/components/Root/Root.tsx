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

import React, { type PropsWithChildren, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { makeStyles, Button, Typography, Box } from '@material-ui/core';
import ExtensionIcon from '@material-ui/icons/Extension';
import HomeIcon from '@material-ui/icons/Home';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarSpace,
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import SecurityIcon from '@material-ui/icons/Security';
import StorageIcon from '@material-ui/icons/Storage';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import { useRhdhTheme } from '../../hooks/useRhdhTheme';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const useSidebarItemStyles = makeStyles(theme => ({
  '.MuiButtonBase-root': {},
  securityIcon: {
    '& .securityIcon': {
      fontSize: '20px !important',
      minWidth: 'unset !important',
      width: '20px !important',
      height: '20px !important',
    },
  },
  submenuItem: {
    marginBottom: 4,
    '& .MuiSvgIcon-root': {
      fontSize: '20px !important',
    },
    '& .MuiTypography-root': {
      marginLeft: 8,
      fontWeight: 400,
      fontSize: 14,
    },
  },
  submenuItemActive: {
    borderRadius: 6,
    border: `1px solid ${
      (theme.palette as { type?: string; mode?: string }).type === 'dark' ||
      (theme.palette as { mode?: string }).mode === 'dark'
        ? 'rgba(255,255,255,0.2)'
        : 'rgba(0,0,0,0.12)'
    }`,
    backgroundColor: `${
      (theme.palette as { type?: string; mode?: string }).type === 'dark' ||
      (theme.palette as { mode?: string }).mode === 'dark'
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,0,0,0.06)'
    } !important`,
  },
  inactiveItem: {
    backgroundColor: 'transparent !important',
  },
  iconContainer: {
    width: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiSvgIcon-root': { fontSize: '20px !important' },
    marginRight: 5,
  },
  text: {
    marginRight: 20,
  },
  collapsibleTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
    padding: '0 !important',
    marginLeft: 0,
    marginBottom: 10,
    textTransform: 'none',
    color: `${
      theme.palette.navigation?.color ??
      ((theme.palette as { type?: string; mode?: string }).type === 'dark' ||
      (theme.palette as { type?: string; mode?: string }).mode === 'dark'
        ? theme.palette.common.white
        : theme.palette.text.primary)
    } !important`,
    '& .MuiTypography-root': {
      color: 'inherit !important',
      marginLeft: theme.spacing(0.5),
      fontSize: 14,
      fontWeight: 600,
    },
    '& .MuiSvgIcon-root': {
      fontSize: '20px !important',
      flexShrink: 0,
    },
    '&:hover': {
      backgroundColor:
        theme.palette.navigation?.navItem?.hoverBackground ??
        'rgba(255,255,255,0.08)',
    },
  },
  collapsibleContent: {
    marginLeft: theme.spacing(3),
  },
}));

const CollapsibleSubmenu = ({
  icon,
  text,
  children,
  classes,
}: {
  icon: React.ReactElement;
  text: string;
  children: React.ReactNode;
  classes: {
    collapsibleTrigger: string;
    collapsibleContent: string;
    iconContainer: string;
    text: string;
  };
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { isOpen: sidebarOpen } = useSidebarOpenState();

  return (
    <Box component="div" display="flex" flexDirection="column" width="100%">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        fullWidth
        className={classes.collapsibleTrigger}
      >
        <Box className={classes.iconContainer}>{icon}</Box>
        {sidebarOpen && (
          <Typography className={classes.text}>{text}</Typography>
        )}
        {sidebarOpen && (isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />)}
      </Button>
      {isOpen && <Box className={classes.collapsibleContent}>{children}</Box>}
    </Box>
  );
};

const Logo = (props: { isOpen?: boolean }) => {
  const { isOpen = false } = props;
  const rhdhTheme = useRhdhTheme();
  const isRhdhThemeEnabled = rhdhTheme !== null;

  let logo: React.ReactElement | null = null;
  if (isRhdhThemeEnabled) {
    const { RhdhLogoFull, RhdhLogoIcon } = rhdhTheme;
    logo = isOpen ? <RhdhLogoFull /> : <RhdhLogoIcon />;
  } else {
    logo = isOpen ? <LogoFull /> : <LogoIcon />;
  }

  return logo;
};

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        <Logo isOpen={isOpen} />
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const classes = useSidebarItemStyles();
  const location = useLocation();
  const isDcmActive = location.pathname === '/dcm';
  const isRbacActive = location.pathname === '/rbac';

  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <SidebarSearchModal />
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MenuIcon />}>
          <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
          <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
          <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
          <SidebarItem
            icon={CreateComponentIcon}
            to="create"
            text="Create..."
          />
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        <SidebarGroup label="Administration" icon={<SecurityIcon />}>
          <CollapsibleSubmenu
            icon={
              <SecurityIcon fontSize="small" className={classes.securityIcon} />
            }
            text="Administration"
            classes={classes}
          >
            <SidebarItem
              icon={StorageIcon}
              to="/dcm"
              text="Data Center"
              className={`${classes.submenuItem} ${
                isDcmActive ? classes.submenuItemActive : classes.inactiveItem
              }`}
            />
            <SidebarItem
              icon={VpnKeyIcon}
              to="/rbac"
              text="RBAC"
              className={`${classes.submenuItem} ${
                isRbacActive ? classes.submenuItemActive : classes.inactiveItem
              }`}
            />
          </CollapsibleSubmenu>
        </SidebarGroup>
        <SidebarGroup
          label="Settings"
          icon={<UserSettingsSignInAvatar />}
          to="/settings"
        >
          <SidebarSettings />
        </SidebarGroup>
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
