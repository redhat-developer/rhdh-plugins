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
/* eslint-disable @backstage/no-undeclared-imports -- deps in dcm-backend package.json */
import { startTestBackend } from '@backstage/backend-test-utils';
import { dcmPlugin } from './plugin';
import request from 'supertest';

describe('plugin', () => {
  it('should serve health endpoint', async () => {
    const { server } = await startTestBackend({
      features: [dcmPlugin],
    });

    const res = await request(server).get('/api/dcm/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
