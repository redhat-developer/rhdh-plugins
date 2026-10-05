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

import type { Entity } from '@backstage/catalog-model';

import { entityHref, entityRefHref } from './entityLinks';

const entity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'code-review', namespace: 'default' },
};

describe('entity links', () => {
  it('builds an entity page URL', () => {
    expect(entityHref(entity)).toBe('/catalog/default/airesource/code-review');
  });

  it('parses bare, fully-qualified, and invalid refs', () => {
    expect(entityRefHref('team-ai-platform')).toBe(
      '/catalog/default/group/team-ai-platform',
    );
    expect(entityRefHref('user:default/jdoe')).toBe(
      '/catalog/default/user/jdoe',
    );
    expect(entityRefHref('group:')).toBeUndefined();
  });
});
