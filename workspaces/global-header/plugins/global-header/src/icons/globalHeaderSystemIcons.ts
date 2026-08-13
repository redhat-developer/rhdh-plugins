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

import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import QuizOutlined from '@mui/icons-material/QuizOutlined';
import Support from '@mui/icons-material/Support';

/**
 * System icons registered for global-header via `IconBundleBlueprint`.
 * Host registrations override via `app.getSystemIcon`.
 *
 * Includes default extension ids and common `globalHeader` config icon ids,
 * using outlined `@mui/icons-material` components.
 */
export const globalHeaderSystemIcons = {
  account: AccountCircleOutlined,
  add: AddCircleOutline,
  article: ArticleOutlined,
  bug_report: BugReportOutlined,
  dashboard: DashboardOutlined,
  developerHub: HubOutlined,
  forum: ForumOutlined,
  logout: LogoutOutlined,
  manageAccounts: ManageAccountsOutlined,
  quiz: QuizOutlined,
  support: Support,
} as const;
