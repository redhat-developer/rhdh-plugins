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
import { mockServices } from '@backstage/backend-test-utils';
import { PostgresAdapter } from './PostgresAdapter';
import { BaseDatabaseAdapter } from './BaseAdapter';

describe('PostgresAdapter', () => {
  const mockDb = {
    raw: jest.fn().mockReturnThis(),
    toQuery: jest.fn().mockReturnThis(),
  } as any;
  it('should return an instance of postgres Adapter', () => {
    const postgresAdapter = new PostgresAdapter(
      mockDb,
      mockServices.logger.mock(),
    );

    expect(postgresAdapter).toBeInstanceOf(BaseDatabaseAdapter);
    expect(postgresAdapter.isJsonSupported()).toBe(true);
    expect(postgresAdapter.isTimezoneSupported()).toBe(true);
    expect(postgresAdapter.isPartitionSupported()).toBe(true);
  });
});
