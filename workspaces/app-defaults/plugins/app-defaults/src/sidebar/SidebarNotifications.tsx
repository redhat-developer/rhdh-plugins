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

import { useApiHolder, useRouteRef } from '@backstage/frontend-plugin-api';
import notificationsPlugin from '@backstage/plugin-notifications/alpha';
import {
  NotificationsSidebarItem,
  notificationsApiRef,
} from '@backstage/plugin-notifications';

/**
 * Renders the notifications sidebar item, but only when the notifications
 * plugin is installed: both its API and its page route must be available.
 * `NotificationsSidebarItem` links to the notifications page, so without the
 * bound route it would throw "No path for routeRef"; the entry is skipped
 * instead of crashing the sidebar.
 *
 * @internal
 */
export function SidebarNotifications() {
  const apis = useApiHolder();
  const notificationsRoute = useRouteRef(notificationsPlugin.routes.root);
  if (!apis.get(notificationsApiRef) || !notificationsRoute) {
    return null;
  }
  return <NotificationsSidebarItem />;
}
