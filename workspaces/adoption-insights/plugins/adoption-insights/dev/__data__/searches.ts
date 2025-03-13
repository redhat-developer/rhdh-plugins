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
import { format, subDays, subMonths, subHours } from 'date-fns';

export const generateHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const date = format(subHours(new Date(), i), 'yyyy-MM-dd HH:00');
    const count = Math.floor(Math.random() * (300 - 150 + 1)) + 150; // NOSONAR
    return { date, count };
  }).reverse();
};

export const generateDaysData = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const count = Math.floor(Math.random() * (300 - 150 + 1)) + 150; // NOSONAR
    return { date, count };
  }).reverse();
};

export const generateMonthsData = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = format(subMonths(new Date(), i), 'yyyy-MM-dd');
    const count = Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500; // NOSONAR
    return { date, count };
  }).reverse();
};

export default {
  grouping: 'hourly',
  data: generateHourlyData(),
};
