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

import { AppHeaderBlueprint } from './AppHeaderBlueprint';
import { appHeaderDataRef } from './appHeaderDataRef';

const Header = () => null;

describe('AppHeaderBlueprint', () => {
  it('attaches to the app layout headers input', () => {
    const extension = AppHeaderBlueprint.make({
      name: 'announcement',
      params: { component: Header },
    });
    const spec = JSON.parse(JSON.stringify(extension));

    expect(spec.kind).toBe('app-header');
    expect(spec.name).toBe('announcement');
    expect(spec.attachTo).toEqual({ id: 'app/layout', input: 'headers' });
  });

  it('yields the header data with the extension id', () => {
    const tester = createExtensionTester(
      AppHeaderBlueprint.make({
        name: 'announcement',
        params: { component: Header, priority: 100 },
      }),
    );

    expect(tester.get(appHeaderDataRef)).toEqual({
      id: 'app-header:announcement',
      component: Header,
      priority: 100,
    });
  });

  it('lets app-config override the priority', () => {
    const tester = createExtensionTester(
      AppHeaderBlueprint.make({
        name: 'announcement',
        params: { component: Header, priority: 100 },
      }),
      { config: { priority: -5 } },
    );

    expect(tester.get(appHeaderDataRef)).toMatchObject({ priority: -5 });
  });
});
