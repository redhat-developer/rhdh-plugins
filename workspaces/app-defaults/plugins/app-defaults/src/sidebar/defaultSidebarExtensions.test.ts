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
  sidebarItemGroupDataRef,
  type SidebarElementData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import {
  defaultSidebarExtensions,
  sidebarAdminGroup,
  sidebarBottomDivider,
  sidebarBottomSpacer,
  sidebarLogoElement,
  sidebarLogoSpacer,
  sidebarNotificationsElement,
  sidebarSearchDivider,
  sidebarSearchElement,
  sidebarSettingsDivider,
  sidebarSettingsGroup,
} from './defaultSidebarExtensions';
import { CompanyLogo } from './logo/CompanyLogo';

const priorityOf = (ext: ExtensionDefinition) =>
  (createExtensionTester(ext).get(sidebarElementDataRef) as SidebarElementData)
    .priority;

describe('defaultSidebarExtensions', () => {
  it('registers logo, gap, search, spacer, dividers, notifications and groups', () => {
    const specs = defaultSidebarExtensions.map(ext =>
      JSON.parse(JSON.stringify(ext)),
    );

    expect(specs.map(s => `${s.kind}/${s.name}`)).toEqual([
      'sidebar-element/logo',
      'sidebar-spacer/logo',
      'sidebar-element/search',
      'sidebar-divider/search',
      'sidebar-spacer/bottom',
      'sidebar-divider/bottom',
      'sidebar-element/notifications',
      'sidebar-divider/settings',
      'sidebar-item-group/admin',
      'sidebar-item-group/settings',
    ]);
    specs.forEach(s =>
      expect(s.attachTo).toEqual({
        id: 'nav-content:app/sidebar',
        input: s.kind === 'sidebar-item-group' ? 'groups' : 'elements',
      }),
    );
  });

  it('orders search first and the bottom block below the spacer', () => {
    expect(priorityOf(sidebarLogoElement)).toBeGreaterThan(
      priorityOf(sidebarLogoSpacer)!,
    );
    expect(priorityOf(sidebarLogoSpacer)).toBeGreaterThan(
      priorityOf(sidebarSearchElement)!,
    );
    expect(priorityOf(sidebarSearchElement)).toBeGreaterThan(0);
    expect(priorityOf(sidebarSearchDivider)).toBeLessThan(
      priorityOf(sidebarSearchElement)!,
    );
    expect(priorityOf(sidebarSearchDivider)).toBeGreaterThan(0);
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

  it('places the admin group above settings, below the settings divider', () => {
    const admin = createExtensionTester(sidebarAdminGroup).get(
      sidebarItemGroupDataRef,
    );
    const settings = createExtensionTester(sidebarSettingsGroup).get(
      sidebarItemGroupDataRef,
    );

    expect(admin).toMatchObject({ id: 'admin', title: 'Administration' });
    expect(admin.to).toBeUndefined();
    expect(settings).toMatchObject({
      id: 'settings',
      title: 'Settings',
      to: '/settings',
    });
    expect(admin.priority!).toBeLessThan(priorityOf(sidebarSettingsDivider)!);
    expect(settings.priority!).toBeLessThan(admin.priority!);
  });

  it('renders the company logo without claiming a page', () => {
    expect(
      createExtensionTester(sidebarLogoElement).get(sidebarElementDataRef),
    ).toMatchObject({ component: CompanyLogo, to: undefined });
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
