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
import { SidebarNotifications } from './SidebarNotifications';
import { SidebarSearch } from './SidebarSearch';

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
      'sidebar-item/rbac',
      'sidebar-item-group/settings',
    ]);
    const inputForKind = (kind: string) => {
      if (kind === 'sidebar-item-group') return 'groups';
      if (kind === 'sidebar-item') return 'items';
      return 'elements';
    };
    specs.forEach(s =>
      expect(s.attachTo).toEqual({
        id: 'nav-content:app/sidebar',
        input: inputForKind(s.kind),
      }),
    );
  });

  it('disables the search and notifications elements by default', () => {
    const disabledById = Object.fromEntries(
      defaultSidebarExtensions.map(ext => {
        const spec = JSON.parse(JSON.stringify(ext));
        return [`${spec.kind}/${spec.name}`, spec.disabled];
      }),
    );

    expect(disabledById['sidebar-element/search']).toBe(true);
    expect(disabledById['sidebar-element/notifications']).toBe(true);
    // Other default entries stay enabled.
    expect(disabledById['sidebar-element/logo']).toBeFalsy();
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

  it('renders the guarded search and notifications components for their pages', () => {
    expect(
      createExtensionTester(sidebarSearchElement).get(sidebarElementDataRef),
    ).toMatchObject({ component: SidebarSearch, to: '/search' });
    expect(
      createExtensionTester(sidebarNotificationsElement).get(
        sidebarElementDataRef,
      ),
    ).toMatchObject({
      component: SidebarNotifications,
      to: '/notifications',
    });
  });
});
