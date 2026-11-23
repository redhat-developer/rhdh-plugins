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

import { LoggerService } from '@backstage/backend-plugin-api';
import {
  NOTIFICATION_FREQUENCIES,
  NotificationFrequency,
} from '@red-hat-developer-hub/backstage-plugin-adoption-insights-common';
import { Knex } from 'knex';

export class NotificationPreferenceStore {
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
  ) {}

  private validFrequency(
    value: string,
    userRef: string,
  ): NotificationFrequency {
    if ((NOTIFICATION_FREQUENCIES as readonly string[]).includes(value)) {
      return value as NotificationFrequency;
    }
    this.logger.warn('Invalid stored notification preference frequency', {
      userRef,
      frequency: value,
    });
    return 'off';
  }

  /** Returns undefined when the user has no row. */
  async get(userRef: string): Promise<NotificationFrequency | undefined> {
    const row = await this.db('notification_preferences')
      .select('frequency')
      .where({ user_ref: userRef })
      .first<{ frequency: string }>();
    return row ? this.validFrequency(row.frequency, userRef) : undefined;
  }

  /** Upserts and returns the previous value (undefined if no row existed). */
  set(
    userRef: string,
    frequency: NotificationFrequency,
  ): Promise<{ previous?: NotificationFrequency }> {
    return this.db.transaction(async trx => {
      // The unique key serializes first writes for this user. SQLite also
      // acquires its write lock before the read below.
      const inserted = await trx('notification_preferences')
        .insert({ user_ref: userRef, frequency, updated_at: trx.fn.now() })
        .onConflict('user_ref')
        .ignore()
        .returning('user_ref');
      if (inserted.length > 0) {
        return { previous: undefined };
      }

      // On PostgreSQL, lock an existing row before reading the value to audit.
      const row = await trx('notification_preferences')
        .select('frequency')
        .where({ user_ref: userRef })
        .forUpdate()
        .first<{ frequency: string }>();
      if (!row) {
        throw new Error(`Notification preference row missing for ${userRef}`);
      }

      await trx('notification_preferences')
        .where({ user_ref: userRef })
        .update({ frequency, updated_at: trx.fn.now() });

      return {
        previous: this.validFrequency(row.frequency, userRef),
      };
    });
  }
}
