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

import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { mockServices, TestDatabases } from '@backstage/backend-test-utils';
import type { Knex } from 'knex';
import { NotificationPreferenceStore } from './NotificationPreferenceStore';

jest.setTimeout(60_000);

const migrationsDir = resolvePackagePath(
  '@red-hat-developer-hub/backstage-plugin-adoption-insights-backend',
  'migrations',
);

describe('NotificationPreferenceStore', () => {
  const databases = TestDatabases.create({ ids: ['POSTGRES_15', 'SQLITE_3'] });

  describe.each(databases.eachSupportedId())('%s', databaseId => {
    let knex: Knex;
    let store: NotificationPreferenceStore;
    const logger = mockServices.logger.mock();

    beforeAll(async () => {
      knex = await databases.init(databaseId);
      await knex.migrate.latest({ directory: migrationsDir });
      store = new NotificationPreferenceStore(knex, logger);
    });

    beforeEach(async () => {
      await knex('notification_preferences').del();
      jest.clearAllMocks();
    });

    it('returns undefined for an unknown user without inserting a row', async () => {
      expect(await store.get('user:default/alice')).toBeUndefined();
      expect(
        await knex('notification_preferences').count('* as count'),
      ).toEqual([{ count: databaseId === 'POSTGRES_15' ? '0' : 0 }]);
    });

    it('inserts, then updates and returns the previous frequency', async () => {
      expect(await store.set('user:default/alice', 'daily')).toEqual({
        previous: undefined,
      });
      expect(await store.set('user:default/alice', 'weekly')).toEqual({
        previous: 'daily',
      });
      expect(await store.get('user:default/alice')).toBe('weekly');
    });

    it('keeps the row when switching to off', async () => {
      await store.set('user:default/alice', 'monthly');
      expect(await store.set('user:default/alice', 'off')).toEqual({
        previous: 'monthly',
      });
      expect(
        await knex('notification_preferences').select('frequency'),
      ).toEqual([{ frequency: 'off' }]);
    });

    it('preserves created_at on update', async () => {
      await store.set('user:default/alice', 'daily');
      const before = await knex('notification_preferences')
        .where({ user_ref: 'user:default/alice' })
        .first('created_at');
      await store.set('user:default/alice', 'weekly');
      const after = await knex('notification_preferences')
        .where({ user_ref: 'user:default/alice' })
        .first('created_at');
      expect(after?.created_at).toEqual(before?.created_at);
    });

    it('isolates two users', async () => {
      await store.set('user:default/alice', 'daily');
      await store.set('user:default/bob', 'monthly');
      expect(await store.get('user:default/alice')).toBe('daily');
      expect(await store.get('user:default/bob')).toBe('monthly');
    });

    it('warns and falls back to off for an invalid stored frequency', async () => {
      await knex('notification_preferences').insert({
        user_ref: 'user:default/alice',
        frequency: '7d',
      });
      expect(await store.get('user:default/alice')).toBe('off');
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid stored notification preference frequency',
        expect.objectContaining({ userRef: 'user:default/alice' }),
      );
    });

    it('migration down drops only the preference table', async () => {
      await knex.migrate.down({ directory: migrationsDir });
      expect(await knex.schema.hasTable('notification_preferences')).toBe(
        false,
      );
      expect(await knex.schema.hasTable('events')).toBe(true);
      expect(await knex.schema.hasTable('failed_events')).toBe(true);
    });
  });
});
