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

import { scaffolderPluginOverride } from './scaffolderPluginOverride';

describe('scaffolderPluginOverride', () => {
  it('keeps the upstream scaffolder plugin id', () => {
    expect(scaffolderPluginOverride.id).toBe('scaffolder');
  });

  it('registers page:scaffolder', () => {
    expect(
      scaffolderPluginOverride.getExtension('page:scaffolder'),
    ).toBeDefined();
  });

  it('uses Self-service as the plugin title', () => {
    expect(scaffolderPluginOverride.title).toBe('Self-service');
  });
});
