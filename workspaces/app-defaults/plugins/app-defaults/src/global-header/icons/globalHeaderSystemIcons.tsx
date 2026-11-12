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

import type { IconElement } from '@backstage/frontend-plugin-api';
import {
  RiAccountCircleLine,
  RiAddCircleLine,
  RiArticleLine,
  RiBugLine,
  RiCustomerService2Line,
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiNodeTree,
  RiQuestionnaireLine,
  RiSpeakLine,
  RiUserSettingsLine,
} from '@remixicon/react';

/**
 * System icons registered for global-header via `IconBundleBlueprint`.
 * Host registrations override via `iconsApi.icon`.
 *
 * Includes default extension ids and common `globalHeader` config icon ids,
 * as Remix `IconElement`s (prefer `<MyIcon />` over deprecated `IconComponent`).
 */
export const globalHeaderSystemIcons: Record<string, IconElement> = {
  account: <RiAccountCircleLine aria-hidden />,
  add: <RiAddCircleLine aria-hidden />,
  article: <RiArticleLine aria-hidden />,
  bugReport: <RiBugLine aria-hidden />,
  dashboard: <RiDashboardLine aria-hidden />,
  developerHub: <RiNodeTree />,
  forum: <RiSpeakLine aria-hidden />,
  logout: <RiLogoutBoxRLine aria-hidden />,
  manageAccounts: <RiUserSettingsLine aria-hidden />,
  quiz: <RiQuestionnaireLine aria-hidden />,
  support: <RiCustomerService2Line aria-hidden />,
};
