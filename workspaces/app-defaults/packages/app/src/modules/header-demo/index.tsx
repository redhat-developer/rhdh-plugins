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

import type { ReactNode } from 'react';
import {
  createExtensionInput,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { AppRootWrapperBlueprint } from '@backstage/plugin-app-react';
import { Box, Text } from '@backstage/ui';
import { AppHeaderBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

/**
 * Demo contributions for the app headers rendered by the app layout of
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`. Headers stack
 * above the sidebar, the content and the drawer, highest priority first.
 *
 * - `announcement` is a thin banner at priority 100, so it sits at the very
 *   top of the viewport, above the global header.
 * - `global-header` hosts the RHDH global header at priority 50 (see
 *   {@link globalHeaderAppHeader}).
 * - `environment` is a second banner at priority 0, below the global header.
 *
 * All of them can be disabled or re-prioritized from `app-config.yaml`, e.g.
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

/**
 * Hosts the global header as an app header so it is ordered with the other
 * headers by priority instead of wrapping the whole app from outside the
 * layout. The global-header plugin ships its header as the app root wrapper
 * `app-root-wrapper:app/global-header`; `app-config.yaml` re-attaches that
 * wrapper to the `wrapper` input of this extension, which renders it without
 * children. Its toolbar components and menu items keep attaching to the
 * wrapper as before. Without the config override the input stays empty and
 * this header renders nothing, so the global header falls back to wrapping
 * the app.
 */
const GlobalHeaderHost = ({
  Wrapper,
}: {
  Wrapper: (props: { children: ReactNode }) => JSX.Element | null;
}) => (
  <>
    {/* The global header reserves space for the docked drawer; the drawer
        now sits below the headers, so keep the header at full width. */}
    <style>{'#global-header { margin-right: 0 !important; }'}</style>
    <Wrapper>{null}</Wrapper>
  </>
);

const globalHeaderAppHeader = AppHeaderBlueprint.makeWithOverrides({
  name: 'global-header',
  inputs: {
    wrapper: createExtensionInput(
      [AppRootWrapperBlueprint.dataRefs.component],
      { singleton: true, optional: true },
    ),
  },
  factory(originalFactory, { inputs }) {
    const Wrapper = inputs.wrapper?.get(
      AppRootWrapperBlueprint.dataRefs.component,
    );
    return originalFactory({
      component: Wrapper
        ? () => <GlobalHeaderHost Wrapper={Wrapper} />
        : () => null,
      priority: 50,
    });
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
  extensions: [announcementHeader, globalHeaderAppHeader, environmentHeader],
});
