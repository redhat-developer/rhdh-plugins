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
import { format, subDays, subHours } from 'date-fns';
import { PluginTrend } from '../../src/types';

export const generateHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const date = format(subHours(new Date(), i), 'yyyy-MM-dd HH:00');
    const count = Math.floor(Math.random() * (300 - 150 + 1)) + 150; // NOSONAR
    return { date, count };
  }).reverse();
};

export const generateLast30DaysData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const count = Math.floor(Math.random() * (100 - 50 + 1)) + 50; // NOSONAR
    return { date, count };
  }).reverse();
};

export const mockPluginViewOne: PluginTrend = {
  plugin_id: 'catalog',
  visit_count: 77,
  trend_percentage: '18.67',
  trend: generateHourlyData(),
};

export const mockPluginViewTwo: PluginTrend = {
  plugin_id: 'ansible',
  visit_count: 77,
  trend_percentage: '18.67',
  trend: generateHourlyData(),
};

export const mockPluginViewThree: PluginTrend = {
  plugin_id: 'argoCD',
  visit_count: 7792,
  trend_percentage: '-18.67',
  trend: generateHourlyData(),
};

export const mockPluginViewFour: PluginTrend = {
  plugin_id: 'argoCD Scaffolder',
  visit_count: 77,
  trend_percentage: '18.67',
  trend: generateHourlyData(),
};

export const mockPluginViewFive: PluginTrend = {
  plugin_id: 'tech docs',
  visit_count: 77,
  trend_percentage: '18.67',
  trend: generateHourlyData(),
};

export const mockPluginViewSix: PluginTrend = {
  plugin_id: 'catalog info',
  visit_count: 44,
  trend_percentage: '-66.67',
  trend: generateHourlyData(),
};

export const mockPluginViews = {
  grouping: 'hourly',
  data: [
    mockPluginViewOne,
    mockPluginViewTwo,
    mockPluginViewThree,
    mockPluginViewFour,
    mockPluginViewFive,
    mockPluginViewSix,
  ],
};
