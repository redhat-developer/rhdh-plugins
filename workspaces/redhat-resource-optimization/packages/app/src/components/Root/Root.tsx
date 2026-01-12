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

import React, { PropsWithChildren, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { makeStyles, Button, Typography } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { AnalyticsIconOutlined } from '@red-hat-developer-hub/plugin-redhat-resource-optimization';
import { OrchestratorIcon } from '@red-hat-developer-hub/backstage-plugin-orchestrator';
import { useRhdhTheme } from '../../hooks/useRhdhTheme';
import { Administration } from '@backstage-community/plugin-rbac';

// Empty icon component to satisfy SidebarItem's required icon prop
const EmptyIcon = () => null;

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

const useSidebarItemStyles = makeStyles({
  costManagementItem: {
    marginBottom: 4,
    '& .MuiBox-root': {
      display: 'none',
    },
    '& .MuiTypography-root': {
      marginLeft: 12,
    },
  },
  inactiveItem: {
    backgroundColor: 'transparent !important',
    color: 'inherit !important',
  },
});

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

const CollapsibleSubmenu = ({
  icon,
  text,
  children,
}: {
  icon: React.ReactElement;
  text: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { isOpen: sidebarOpen } = useSidebarOpenState();

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        fullWidth
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '12px 16px',
          textTransform: 'none',
          color: 'inherit',
          marginLeft: 18,
        }}
      >
        {icon}
        {sidebarOpen && (
          <Typography style={{ flex: 1, fontSize: 14 }}>{text}</Typography>
        )}
        {sidebarOpen &&
          (isOpen ? (
            <ExpandMoreIcon style={{ fontSize: 20 }} />
          ) : (
            <ChevronRightIcon style={{ fontSize: 20 }} />
          ))}
      </Button>
      {isOpen && <div style={{ marginLeft: 38 }}>{children}</div>}
    </>
  );
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

  const isOpenShiftActive = useMemo(() => {
    const pathname = location.pathname;
    return pathname === '/redhat-resource-optimization/ocp';
  }, [location.pathname]);

  const isOptimizationsActive = useMemo(() => {
    const pathname = location.pathname;
    const basePath = '/redhat-resource-optimization';
    if (pathname === basePath) {
      return true;
    }
    if (pathname.startsWith(`${basePath}/`)) {
      const remainingPath = pathname.slice(basePath.length + 1);
      const pathParts = remainingPath.split('/');
      const firstPart = pathParts[0];
      return firstPart !== undefined && firstPart !== '' && firstPart !== 'ocp';
    }
    return false;
  }, [location.pathname]);

  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <SidebarSearchModal />
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MenuIcon />}>
          {/* Global nav, not org-specific */}
          <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
          <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
          <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
          <SidebarItem
            icon={CreateComponentIcon}
            to="create"
            text="Create..."
          />
          {/* End global nav */}
          <SidebarDivider />

          <CollapsibleSubmenu
            icon={<AnalyticsIconOutlined />}
            text="Cost management"
          >
            <SidebarItem
              icon={EmptyIcon}
              to="/redhat-resource-optimization/ocp"
              text="OpenShift"
              className={`${classes.costManagementItem} ${
                isOpenShiftActive ? '' : classes.inactiveItem
              }`}
            />
            <SidebarItem
              icon={EmptyIcon}
              to="/redhat-resource-optimization"
              text="Optimizations"
              className={`${classes.costManagementItem} ${
                isOptimizationsActive ? '' : classes.inactiveItem
              }`}
            />
          </CollapsibleSubmenu>

          <SidebarItem
            icon={OrchestratorIcon}
            to="orchestrator"
            text="Orchestrator"
          />
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        <Administration />
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
