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

import { createExtensionTester } from '@backstage/frontend-test-utils';

import { AppDrawerContentBlueprint } from './AppDrawerContentBlueprint';
import { appDrawerContentDataRef } from './appDrawerContentDataRef';

describe('AppDrawerContentBlueprint', () => {
  it('attaches to the app layout drawers input', () => {
    const extension = AppDrawerContentBlueprint.make({
      name: 'chat',
      params: { id: 'chat', element: <div /> },
    });
    const spec = JSON.parse(JSON.stringify(extension));

    expect(spec.kind).toBe('app-drawer-content');
    expect(spec.attachTo).toEqual({ id: 'app/layout', input: 'drawers' });
  });

  it('yields the drawer content and lets app-config override the options', () => {
    const element = <div />;
    const tester = createExtensionTester(
      AppDrawerContentBlueprint.make({
        name: 'chat',
        params: { id: 'chat', element, resizable: true, defaultWidth: 450 },
      }),
      { config: { defaultWidth: 600, resizable: false } },
    );

    expect(tester.get(appDrawerContentDataRef)).toEqual({
      id: 'chat',
      element,
      resizable: false,
      defaultWidth: 600,
      priority: undefined,
    });
  });
});
