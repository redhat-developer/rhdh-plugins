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

import { cloneElement, ReactElement, useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import useObservable from 'react-use/esm/useObservable';

import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import {
  appThemeApiRef,
  configApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  NavContentBlueprint,
  ThemeBlueprint,
} from '@backstage/plugin-app-react';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { mockApis } from '@backstage/test-utils';

import ListItemIcon from '@material-ui/core';
import ListItemText from '@material-ui/core';
import Menu from '@material-ui/core';
import MenuItem from '@material-ui/core';
import AutoIcon from '@mui/icons-material/BrightnessAuto';

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import bulkImportPlugin, { bulkImportTranslationsModule } from '../src/alpha';
import { bulkImportApiRef, mockBulkImportApi, mockConfigApi } from './mocks';

const bulkImportDevModule = createFrontendModule({
  pluginId: 'bulk-import',
  extensions: [
    ApiBlueprint.make({
      name: 'bulk-import-mock',
      params: defineParams =>
        defineParams({
          api: bulkImportApiRef,
          deps: {},
          factory: () => mockBulkImportApi,
        }),
    }),
    ApiBlueprint.make({
      name: 'config-mock',
      params: defineParams =>
        defineParams({
          api: configApiRef,
          deps: {},
          factory: () => mockConfigApi,
        }),
    }),
    ApiBlueprint.make({
      name: 'permission-mock',
      params: defineParams =>
        defineParams({
          api: permissionApiRef,
          deps: {},
          factory: () => mockApis.permission(),
        }),
    }),
  ],
});

function ThemeIcon({
  active,
  icon,
}: {
  active?: boolean;
  icon?: ReactElement;
}) {
  return icon ? (
    cloneElement(icon, { color: active ? 'primary' : undefined })
  ) : (
    <AutoIcon color={active ? 'primary' : undefined} />
  );
}

function SidebarThemeSwitcher() {
  const appThemeApi = useApi(appThemeApiRef);
  const themeId = useObservable(
    appThemeApi.activeThemeId$(),
    appThemeApi.getActiveThemeId(),
  );
  const themes = appThemeApi.getInstalledThemes();
  const activeTheme = themes.find(t => t.id === themeId);
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<Element>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };
  const handleSelectTheme = (newThemeId?: string) => {
    if (newThemeId && themes.some(t => t.id === newThemeId)) {
      appThemeApi.setActiveThemeId(newThemeId);
    } else {
      appThemeApi.setActiveThemeId(undefined);
    }
    setAnchorEl(undefined);
  };
  const handleClose = () => setAnchorEl(undefined);

  const ActiveIcon = useCallback(
    () => <ThemeIcon icon={activeTheme?.icon} />,
    [activeTheme],
  );

  return (
    <>
      <SidebarItem icon={ActiveIcon} text="Switch Theme" onClick={handleOpen} />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ role: 'listbox' }}
      >
        <MenuItem disabled>Choose a theme</MenuItem>
        <MenuItem
          selected={themeId === undefined}
          onClick={() => handleSelectTheme(undefined)}
        >
          <ListItemIcon>
            <ThemeIcon active={themeId === undefined} />
          </ListItemIcon>
          <ListItemText>Auto</ListItemText>
        </MenuItem>
        {themes.map(theme => {
          const active = theme.id === themeId;
          return (
            <MenuItem
              key={theme.id}
              selected={active}
              onClick={() => handleSelectTheme(theme.id)}
            >
              <ListItemIcon>
                <ThemeIcon icon={theme.icon} active={active} />
              </ListItemIcon>
              <ListItemText>{theme.title}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarScrollWrapper>
          <SidebarGroup label="Menu">
            {items.map((item, index) => (
              <SidebarItem {...item} key={index} />
            ))}
          </SidebarGroup>
        </SidebarScrollWrapper>
        <SidebarSpace />
        <SidebarThemeSwitcher />
        <SidebarLanguageSwitcher />
        <SidebarSignOutButton />
      </Sidebar>
    ),
  },
});

const themeExtensions = getAllThemes().map(theme =>
  ThemeBlueprint.make({
    name: theme.id,
    params: { theme },
  }),
);

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [devSidebarContent, ...themeExtensions],
});

const defaultPage = '/bulk-import';

const app = createApp({
  features: [
    bulkImportPlugin,
    bulkImportTranslationsModule,
    bulkImportDevModule,
    devNavModule,
  ],
});

const root = app.createRoot();

if (typeof window !== 'undefined' && window.location.pathname === '/') {
  window.location.pathname = defaultPage;
}

ReactDOM.createRoot(document.getElementById('root')!).render(root);
