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

import { isToday, differenceInCalendarDays, format, isValid } from 'date-fns';

export function getLastUpdatedLabel(timestamp: string | number | Date) {
  if (!timestamp) return '--';

  const date = new Date(timestamp);

  if (!isValid(date)) return '--';

  const today = new Date();

  if (isToday(date)) {
    return 'Today';
  }

  const diff = differenceInCalendarDays(today, date);

  if (diff <= 6) {
    return `${diff} day${diff > 1 ? 's' : ''} ago`;
  }

  return format(date, 'dd MMM yyyy');
}
