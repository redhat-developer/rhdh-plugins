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
  LoggerService,
  RootConfigService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { NotificationService } from '@backstage/plugin-notifications-node';
import { EventDatabase } from '../database/event-database';
import { NotificationFrequency } from '../types/event';

function formatTimeSaved(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (days > 0 && hours > 0) return `${days} days ${hours} hours`;
  if (days > 0) return `${days} days`;
  if (hours > 0 && minutes > 0) return `${hours} hours ${minutes} minutes`;
  if (hours > 0) return `${hours} hours`;
  return `${minutes} minutes`;
}

function getPeriodLabel(frequency: NotificationFrequency): string {
  switch (frequency) {
    case 'daily':
      return 'today';
    case 'weekly':
      return 'this week';
    case 'monthly':
      return 'this month';
    default:
      return 'this week';
  }
}

function shouldSendForFrequency(frequency: NotificationFrequency): boolean {
  if (frequency === 'none') return false;
  if (frequency === 'daily') return true;

  const now = new Date();
  if (frequency === 'weekly') return now.getDay() === 1;
  if (frequency === 'monthly') return now.getDate() === 1;

  return false;
}

export async function scheduleTimeSavedNotifications(options: {
  scheduler: SchedulerService;
  db: EventDatabase;
  notification: NotificationService;
  logger: LoggerService;
  config: RootConfigService;
}): Promise<void> {
  const { scheduler, db, notification, logger, config } = options;

  const enabled =
    config.getOptionalBoolean('adoptionInsights.notifications.enabled') ?? true;
  if (!enabled) {
    logger.info('[TIME-SAVED-NOTIFICATIONS] Notifications disabled via config');
    return;
  }

  const baseUrl = config.getOptionalString('app.baseUrl') ?? '';

  const runner = scheduler.createScheduledTaskRunner({
    frequency: { cron: '0 9 * * *' },
    timeout: { minutes: 5 },
  });

  runner.run({
    id: 'adoption-insights:time-saved-notifications',
    fn: async () => {
      const lookbacks: {
        frequency: NotificationFrequency;
        days: number;
      }[] = [
        { frequency: 'daily', days: 1 },
        { frequency: 'weekly', days: 7 },
        { frequency: 'monthly', days: 30 },
      ];

      let sentCount = 0;

      for (const { frequency, days } of lookbacks) {
        if (!shouldSendForFrequency(frequency)) continue;

        const since = new Date();
        since.setDate(since.getDate() - days);
        const users = await db.getTimeSavedPerUser(since.toISOString());
        const period = getPeriodLabel(frequency);

        for (const user of users) {
          if (user.total_time_saved_minutes <= 0) continue;

          const pref = await db.getNotificationPreference(user.user_ref);
          if (pref !== frequency) continue;

          const timeSaved = formatTimeSaved(user.total_time_saved_minutes);

          await notification.send({
            recipients: { type: 'entity', entityRef: user.user_ref },
            payload: {
              title: `You completed ${user.execution_count} self-service actions ${period}, saving an estimated ${timeSaved} of time.`,
              link: `${baseUrl}/adoption-insights`,
              topic: 'time-saved-summary',
            },
          });
          sentCount++;
        }
      }

      logger.info(`[TIME-SAVED-NOTIFICATIONS] Sent ${sentCount} notifications`);
    },
  });
}
