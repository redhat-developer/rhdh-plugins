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

import { NotFoundErrorPage } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';
import { SwappableComponentBlueprint } from '@backstage/plugin-app-react';

import { notFoundExtension } from './notFoundExtension';

describe('notFoundExtension', () => {
  it('replaces the core not-found error page of @backstage/plugin-app', async () => {
    const spec = JSON.parse(JSON.stringify(notFoundExtension));
    expect(spec.kind).toBe('component');
    expect(spec.name).toBe('core-not-found-error-page');
    expect(spec.attachTo).toEqual({
      id: 'api:app/swappable-components',
      input: 'components',
    });

    const component = createExtensionTester(notFoundExtension).get(
      SwappableComponentBlueprint.dataRefs.component,
    );
    expect(component.ref.id).toBe(NotFoundErrorPage.ref.id);
    const { CustomNotFoundPage } = await import('./CustomNotFoundPage');
    await expect(component.loader?.()).resolves.toBe(CustomNotFoundPage);
  });
});
