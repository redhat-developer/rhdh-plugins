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
import { PluginTrend } from '../../src/types';

export const mockPluginView: PluginTrend = {
  plugin_id: 'catalog',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViewTwo: PluginTrend = {
  plugin_id: 'ansible',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViewThree: PluginTrend = {
  plugin_id: 'argoCD',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViewFour: PluginTrend = {
  plugin_id: 'argoCD Scaffolder',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViewFive: PluginTrend = {
  plugin_id: 'tech docs',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViewSix: PluginTrend = {
  plugin_id: 'catalog info',
  count: '44',
  trend_percentage: '-66.67',
  trend: [
    {
      date: '2025-02-13T05:28:38Z',
      count: 9,
    },
    {
      date: '2025-02-14T05:28:38Z',
      count: 17,
    },
    {
      date: '2025-02-18T05:28:38Z',
      count: 15,
    },
    {
      date: '2025-02-19T05:28:38Z',
      count: 3,
    },
  ],
};

export const mockPluginViews = [
  mockPluginView,
  mockPluginViewTwo,
  mockPluginViewThree,
  mockPluginViewFour,
  mockPluginViewFive,
  mockPluginViewSix,
];
