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
import { coreExtensionData } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';

import { LIGHTSPEED_PATH } from './const';
import intelligentAssistantPlugin, {
  intelligentAssistantFABModule,
  intelligentAssistantRedirectModule,
  intelligentAssistantTranslationsModule,
} from './index';

// An NFS plugin that contributes nothing still boots clean: no error, no console
// warning, exit 0. `expect(plugin).toBeDefined()` passes against all of it, which
// is what src/plugin.test.ts asserts today.
const extensionIds = () =>
  (intelligentAssistantPlugin as any).extensions.map((e: any) => e.id);

describe('intelligent-assistant NFS plugin', () => {
  it('is a frontend plugin under the id the app routes to', () => {
    expect((intelligentAssistantPlugin as any).$$type).toBe(
      '@backstage/FrontendPlugin',
    );
    expect((intelligentAssistantPlugin as any).id).toBe(
      'intelligent-assistant',
    );
  });

  it('serves the page at the path the sidebar and the legacy redirect point at', () => {
    const tester = createExtensionTester(
      intelligentAssistantPlugin.getExtension('page:intelligent-assistant'),
    );

    expect(tester.get(coreExtensionData.routePath)).toBe(LIGHTSPEED_PATH);
    // Presence, not identity: createFrontendPlugin re-wraps route refs, so the
    // object here is not the one index.tsx created.
    expect(tester.get(coreExtensionData.routeRef)).toBeDefined();
  });

  it('registers both APIs, the page and the drawer on the plugin', () => {
    // createExtensionTester instantiates an extension in isolation, so the
    // assertions above stay green when one is dropped from `extensions`. The
    // APIs carry no extension data to assert, so this is the only thing standing
    // between them and a page whose every request fails.
    expect(extensionIds()).toEqual(
      expect.arrayContaining([
        'api:intelligent-assistant/intelligent-assistant',
        'api:intelligent-assistant/notebooks',
        'page:intelligent-assistant',
      ]),
    );
    expect(extensionIds().some((id: string) => id.includes('drawer'))).toBe(
      true,
    );
  });

  it('keeps both routes the app resolves links against', () => {
    // lightspeedConversation is a subRouteRef; dropping it breaks deep links to
    // a conversation without touching the page, which nothing above would catch.
    expect(intelligentAssistantPlugin.routes.root).toBeDefined();
    expect(
      intelligentAssistantPlugin.routes.lightspeedConversation,
    ).toBeDefined();
  });
});

describe('intelligent-assistant NFS modules', () => {
  // All three attach to `app`, not to this plugin. A module that names a host
  // plugin the app does not have is silently orphaned rather than an error, so
  // the pluginId is the assertion that matters.
  it.each([
    ['redirect', intelligentAssistantRedirectModule],
    ['FAB', intelligentAssistantFABModule],
    ['translations', intelligentAssistantTranslationsModule],
  ])('exports the %s module against the app plugin', (_name, mod) => {
    expect((mod as any).$$type).toBe('@backstage/FrontendModule');
    expect((mod as any).pluginId).toBe('app');
  });
});
