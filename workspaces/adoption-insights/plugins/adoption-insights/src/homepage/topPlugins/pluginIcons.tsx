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

import type { ReactElement } from 'react';

import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import RadarIcon from '@mui/icons-material/Radar';
import SchemaOutlinedIcon from '@mui/icons-material/SchemaOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';

import { normalizePluginId } from '../popularContent/pluginDestinations';

const ICON_SIZE = 16;

type IconComponent = (props: SvgIconProps) => ReactElement;

/** Sidebar-aligned icons for known plugin ids (DTUX-3136: 16px). */
const KNOWN_PLUGIN_ICONS: Record<string, IconComponent> = {
  catalog: CategoryOutlinedIcon,
  'catalog-graph': SchemaOutlinedIcon,
  scaffolder: CreateNewFolderOutlinedIcon,
  techdocs: LibraryBooksOutlinedIcon,
  'tech-docs': LibraryBooksOutlinedIcon,
  search: SearchOutlinedIcon,
  homepage: HomeOutlinedIcon,
  home: HomeOutlinedIcon,
  app: AppsOutlinedIcon,
  'user-settings': SettingsOutlinedIcon,
  notifications: NotificationsOutlinedIcon,
  'adoption-insights': QueryStatsOutlinedIcon,
  'bulk-import': UploadFileOutlinedIcon,
  'global-header': ManageAccountsOutlinedIcon,
  rbac: VpnKeyOutlinedIcon,
  'tech-radar': RadarIcon,
  extensions: ExtensionOutlinedIcon,
  orchestrator: HubOutlinedIcon,
  'intelligent-assistant': QueryStatsOutlinedIcon,
  scorecard: QueryStatsOutlinedIcon,
  kubernetes: HubOutlinedIcon,
};

/**
 * Resolve a 16px leading icon for a plugin id (sidebar-aligned when known).
 */
export function resolvePluginIcon(pluginId: string): ReactElement {
  const key = normalizePluginId(pluginId);
  const Icon = KNOWN_PLUGIN_ICONS[key] ?? ExtensionOutlinedIcon;
  return <Icon fontSize="inherit" style={{ fontSize: ICON_SIZE }} />;
}
