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
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import ListIcon from '@mui/icons-material/List';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PeopleIcon from '@mui/icons-material/People';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import StarIcon from '@mui/icons-material/Star';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SupportIcon from '@mui/icons-material/Support';
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';

import { DeveloperHubIcon } from './DeveloperHub';

/**
 * RHDH common system-icon IDs. Keep these stable — sidebar items, menu YAML,
 * and NFS `config.icon` strings resolve icons by these keys.
 *
 * Matches the legacy catalog in rhdh `packages/app/.../CommonIcons.tsx`.
 */
export const commonIcons: Record<string, IconComponent> = {
  home: HomeOutlinedIcon,
  group: PeopleIcon,
  category: CategoryOutlinedIcon,
  extension: ExtensionOutlinedIcon,
  school: SchoolOutlinedIcon,
  add: AddCircleOutlineIcon,
  list: ListIcon,
  layers: LayersIcon,
  star: StarIcon,
  favorite: FavoriteIcon,
  bookmarks: BookmarksOutlinedIcon,
  queryStats: QueryStatsOutlinedIcon,
  chart: InsertChartOutlinedIcon,
  business: BusinessOutlinedIcon,
  storefront: StorefrontOutlinedIcon,
  folder: FolderOpenOutlinedIcon,
  cloud: CloudOutlinedIcon,
  monitor: MonitorHeartOutlinedIcon,
  feedback: TextsmsOutlinedIcon,
  validate: RuleOutlinedIcon,
  security: GppGoodOutlinedIcon,
  help: HelpOutlineIcon,
  support: SupportIcon,
  quickstart: WavingHandOutlinedIcon,
  notifications: NotificationsOutlinedIcon,
  manageAccounts: ManageAccountsOutlinedIcon,
  logout: LogoutOutlinedIcon,
  developerHub: DeveloperHubIcon,
  account: AccountCircleOutlinedIcon,
  admin: GppMaybeOutlinedIcon,
};
