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

import {
  DEFAULT_SONATAFLOW_BASE_URL,
  DEFAULT_SONATAFLOW_CONTAINER_IMAGE,
  DEFAULT_SONATAFLOW_PERSISTENCE_PATH,
  DEFAULT_WORKFLOWS_PATH,
} from './constants';

describe('orchestrator common constants', () => {
  it('exports expected sonataflow defaults', () => {
    expect(DEFAULT_SONATAFLOW_CONTAINER_IMAGE).toContain('sonataflow');
    expect(DEFAULT_SONATAFLOW_PERSISTENCE_PATH).toBe(
      '/home/kogito/persistence',
    );
    expect(DEFAULT_SONATAFLOW_BASE_URL).toBe('http://localhost');
  });

  it('exports the default workflows path', () => {
    expect(DEFAULT_WORKFLOWS_PATH).toBe('workflows');
  });
});
