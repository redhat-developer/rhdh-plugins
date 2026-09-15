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

import { NotificationsSidebarItem } from '@backstage/plugin-notifications';
import { SidebarSearchModal } from '@backstage/plugin-search';
import type { ExtensionDefinition } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';
import {
  sidebarElementDataRef,
  type SidebarElementData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import {
  defaultSidebarExtensions,
  sidebarBottomDivider,
  sidebarBottomSpacer,
  sidebarNotificationsElement,
  sidebarSearchElement,
  sidebarSettingsDivider,
} from './defaultSidebarExtensions';

describe('defaultSidebarExtensions', () => {
  it('registers search, spacer, dividers and notifications', () => {
    const specs = defaultSidebarExtensions.map(ext =>
      JSON.parse(JSON.stringify(ext)),
    );

    expect(specs.map(s => `${s.kind}/${s.name}`)).toEqual([
      'sidebar-element/search',
      'sidebar-spacer/bottom',
      'sidebar-divider/bottom',
      'sidebar-element/notifications',
      'sidebar-divider/settings',
    ]);
    specs.forEach(s =>
      expect(s.attachTo).toEqual({
        id: 'nav-content:app/sidebar',
        input: 'elements',
      }),
    );
  });

  it('orders search first and the bottom block below the spacer', () => {
    const priorityOf = (ext: ExtensionDefinition) =>
      (
        createExtensionTester(ext).get(
          sidebarElementDataRef,
        ) as SidebarElementData
      ).priority;

    expect(priorityOf(sidebarSearchElement)).toBeGreaterThan(0);
    expect(priorityOf(sidebarBottomSpacer)).toBeLessThan(0);
    expect(priorityOf(sidebarBottomDivider)).toBeLessThan(
      priorityOf(sidebarBottomSpacer)!,
    );
    expect(priorityOf(sidebarNotificationsElement)).toBeLessThan(
      priorityOf(sidebarBottomDivider)!,
    );
    expect(priorityOf(sidebarSettingsDivider)).toBeLessThan(
      priorityOf(sidebarNotificationsElement)!,
    );
  });

  it('renders the search modal and notifications components for their pages', () => {
    expect(
      createExtensionTester(sidebarSearchElement).get(sidebarElementDataRef),
    ).toMatchObject({ component: SidebarSearchModal, to: '/search' });
    expect(
      createExtensionTester(sidebarNotificationsElement).get(
        sidebarElementDataRef,
      ),
    ).toMatchObject({
      component: NotificationsSidebarItem,
      to: '/notifications',
    });
  });
});
