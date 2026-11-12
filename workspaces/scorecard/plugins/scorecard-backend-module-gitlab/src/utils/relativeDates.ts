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

import { daysToMilliseconds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

/**
 * Returns a Date that is the given number of days before `now`.
 */
export function daysAgo(days: number, now: number = Date.now()): Date {
  return new Date(now - daysToMilliseconds(days));
}

/**
 * Returns a Date that is 7 days before `now`.
 */
export function sevenDaysAgo(now: number = Date.now()): Date {
  return daysAgo(7, now);
}

/**
 * Returns a Date that is 1 day before `now`.
 */
export function oneDayAgo(now: number = Date.now()): Date {
  return daysAgo(1, now);
}
