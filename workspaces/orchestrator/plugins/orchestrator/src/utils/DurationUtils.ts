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

import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { orchestratorTranslationRef } from '../translations';

/**
 * Format duration in milliseconds to a human-readable string
 * Similar to moment.js humanize() - shows only the largest unit
 * @param milliseconds - Duration in milliseconds
 * @param t - Translation function
 * @returns Human-readable duration string (e.g., "2 minutes", "an hour")
 */
export const formatDuration = (
  milliseconds: number,
  t: TranslationFunction<typeof orchestratorTranslationRef.T>,
): string => {
  const seconds = Math.abs(milliseconds) / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  const years = days / 365;

  if (years >= 1) {
    const roundedYears = Math.round(years);
    return roundedYears === 1
      ? t('duration.aYear')
      : t('duration.years').replace('{{count}}', String(roundedYears));
  }
  if (months >= 1) {
    const roundedMonths = Math.round(months);
    return roundedMonths === 1
      ? t('duration.aMonth')
      : t('duration.months').replace('{{count}}', String(roundedMonths));
  }
  if (days >= 1) {
    const roundedDays = Math.round(days);
    return roundedDays === 1
      ? t('duration.aDay')
      : t('duration.days').replace('{{count}}', String(roundedDays));
  }
  if (hours >= 1) {
    const roundedHours = Math.round(hours);
    return roundedHours === 1
      ? t('duration.anHour')
      : t('duration.hours').replace('{{count}}', String(roundedHours));
  }
  if (minutes >= 1) {
    const roundedMinutes = Math.round(minutes);
    return roundedMinutes === 1
      ? t('duration.aMinute')
      : t('duration.minutes').replace('{{count}}', String(roundedMinutes));
  }
  if (seconds >= 1) {
    const roundedSeconds = Math.round(seconds);
    return roundedSeconds === 1
      ? t('duration.aSecond')
      : t('duration.seconds').replace('{{count}}', String(roundedSeconds));
  }
  return t('duration.aFewSeconds');
};
