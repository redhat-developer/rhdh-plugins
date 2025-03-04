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
import { adoptionInsightsPlugin } from './plugin';
import request from 'supertest';

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  // eslint-disable-next-line jest/expect-expect
  it('should throw Bad request when query params are not passed', async () => {
    const { server } = await startTestBackend({
      features: [adoptionInsightsPlugin],
    });

    await request(server)
      .get('/api/adoption-insights/events')
      .expect(400, {
        message: 'Invalid query',
        errors: {
          start_date: [
            'start_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)',
          ],
          end_date: ['end_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)'],
          type: [
            'Invalid type. Allowed values: total_users,daily_users,top_plugin_views,top_templates_views,top_techdocs_views,top_searches,top_catalog_entities',
          ],
        },
      });
  });

  // eslint-disable-next-line jest/expect-expect
  it('should return the data for valid query', async () => {
    const { server } = await startTestBackend({
      features: [adoptionInsightsPlugin],
    });

    await request(server)
      .get(
        '/api/adoption-insights/events?type=daily_users&start_date=2025-03-02&end_date=2025-03-04',
      )
      .expect(200, []);
  });
});
