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

/** Allowed frequencies for a user's time-saved notification summaries.
 * @public
 */
export const NOTIFICATION_FREQUENCIES = [
  'off',
  'daily',
  'weekly',
  'monthly',
] as const;

/** Frequency selected by a user for time-saved notification summaries.
 * @public
 */
export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number];

/** Frequency used when a user has not saved a preference.
 * @public
 */
export const DEFAULT_NOTIFICATION_FREQUENCY: NotificationFrequency = 'off';

/** A user's time-saved notification preference.
 * @public
 */
export type NotificationPreference = { frequency: NotificationFrequency };
