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

import { validateNoDuplicateRetentionOwners } from './module';
import type { SkillsCatalogProviderConfig } from './types';

const config: SkillsCatalogProviderConfig = {
  id: 'one',
  namespace: 'default',
  defaultOwner: 'team',
  defaultLifecycle: 'production',
  sources: [
    {
      sourceType: 'oci',
      sourceId: 'skills',
      connectorPluginId: 'skill-image-connector',
    },
  ],
};
it('rejects duplicate retention owners across provider instances', () => {
  expect(() =>
    validateNoDuplicateRetentionOwners([config, { ...config, id: 'two' }]),
  ).toThrow('Duplicate retention-owner');
});
it('allows independent source identities', () => {
  expect(() =>
    validateNoDuplicateRetentionOwners([
      config,
      {
        ...config,
        id: 'two',
        sources: [{ ...config.sources[0], sourceId: 'other' }],
      },
    ]),
  ).not.toThrow();
});
