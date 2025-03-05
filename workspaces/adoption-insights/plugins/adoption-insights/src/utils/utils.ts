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
  format,
  startOfToday,
  startOfYear,
  subDays,
  eachMonthOfInterval,
  startOfMonth,
  endOfYear,
} from 'date-fns';

export const getDateRange = (value: string) => {
  const startDate: Date | null = null;
  const endDate: Date | null = null;
  const today = startOfToday();

  switch (value) {
    case 'today':
      return {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-week':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-month':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    case 'last-year':
      return {
        startDate: format(startOfYear(today), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };

    default:
      return { startDate, endDate };
  }
};

type UserStats = {
  date: string;
  returningUsers: number;
  newUsers: number;
  total: number;
};

export const getXAxisTickValues = (data: UserStats[]) => {
  // Needs to add X Axis labels logic
  if (data.length < 2) return data.map(item => item.date);

  return [
    data[0].date,
    data[Math.floor(data.length / 2 - 1)].date,
    data[data.length - 1].date,
  ];
};

export const getXAxisformat = (tickItem: string) => {
  const date = new Date(tickItem);
  return format(date, 'MMMM yy');
};

// Dummy Data Generator. Needs to remove
const generateYearsData = () => {
  const start = startOfYear(new Date());
  const end = endOfYear(new Date());

  return eachMonthOfInterval({ start, end }).map(date => {
    const returningUsers = Math.floor(Math.random() * 300) + 300;
    const newUsers = Math.floor(Math.random() * 300);

    return {
      date: format(startOfMonth(date), 'yyyy-MM-dd'),
      returningUsers,
      newUsers,
      total: returningUsers + newUsers,
    };
  });
};

// Needs to remove once actuall data started fetched
export const dummyData = generateYearsData();
