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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { Box, Text } from '@backstage/ui';
import { AppHeaderBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

/**
 * Demo contributions for the app headers rendered by the app layout of
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`. Headers stack
 * above the sidebar, the content and the drawer, highest priority first.
 *
 * - `announcement` is a thin banner at priority 100, so it sits at the very
 *   top of the viewport.
 * - `environment` is a second, lower-priority banner that shows the ordering.
 *
 * Both can be disabled or re-prioritized from `app-config.yaml`, e.g.
 * `app-header:app/announcement: false`.
 */
const AnnouncementHeader = () => (
  <Box bg="success" px="4" py="1" style={{ textAlign: 'center' }}>
    <Text variant="body-small" weight="bold">
      Demo announcement header (app-header:app/announcement, priority 100)
    </Text>
  </Box>
);

const EnvironmentHeader = () => (
  <Box bg="warning" px="4" py="1" style={{ textAlign: 'center' }}>
    <Text variant="body-small">
      Demo environment header (app-header:app/environment, priority 0)
    </Text>
  </Box>
);

const announcementHeader = AppHeaderBlueprint.make({
  name: 'announcement',
  params: {
    component: AnnouncementHeader,
    priority: 100,
  },
});

const environmentHeader = AppHeaderBlueprint.make({
  name: 'environment',
  params: {
    component: EnvironmentHeader,
  },
});

export const headerDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [announcementHeader, environmentHeader],
});
