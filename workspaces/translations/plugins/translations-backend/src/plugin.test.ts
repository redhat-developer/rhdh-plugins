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
import { startTestBackend } from '@backstage/backend-test-utils';
import { translationsPlugin } from './plugin';

describe('translations plugin', () => {
  it('should initialize without errors', async () => {
    const { server } = await startTestBackend({
      features: [translationsPlugin],
    });

    expect(server).toBeDefined();
  });

  it('should export the plugin correctly', () => {
    expect(translationsPlugin).toBeDefined();
    expect(typeof translationsPlugin).toBe('object');
  });
});
