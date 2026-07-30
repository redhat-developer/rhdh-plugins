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

import { MockStarredEntitiesApi } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { MockSearchApi } from '@backstage/plugin-search-react';
import {
  type Visit,
  type VisitsApi,
  type VisitsApiQueryParams,
  type VisitsApiSaveParams,
} from '@backstage/plugin-home';
import { QuickAccessApi } from '../src/api';
import type { QuickAccessLink } from '../src/types';
import defaultQuickAccess from './quickaccess-default.json';

const entities = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'service-a',
      description: 'Hello, I am service A with a title',
      title: 'Service A',
    },
    spec: { type: 'service', lifecycle: 'production', owner: 'guest' },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'service-b',
      description: 'Hello, I am service B',
    },
    spec: { type: 'service', lifecycle: 'production', owner: 'guest' },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'service-c',
      description: 'Hello, I am service C',
    },
    spec: { type: 'service', lifecycle: 'production', owner: 'guest' },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'service-d',
      description: 'Hello, I am service D',
    },
    spec: { type: 'service', lifecycle: 'production', owner: 'guest' },
  },
];

export class MockQuickAccessApi implements QuickAccessApi {
  async getQuickAccessLinks(): Promise<QuickAccessLink[]> {
    return defaultQuickAccess as QuickAccessLink[];
  }
}

export class MockVisitsApi implements VisitsApi {
  async list(queryParams?: VisitsApiQueryParams): Promise<Visit[]> {
    const links = [
      { id: 'example-app', name: 'example-app', pathname: '/example-app' },
      { id: 'another-app', name: 'another-app', pathname: '/another-app' },
      {
        id: 'component:default/service-a',
        name: 'Service A',
        pathname: '/catalog/default/component/service-a',
        entityRef: 'component:default/service-a',
      },
      {
        id: 'component:default/service-b',
        name: 'Service B',
        pathname: '/catalog/default/component/service-b',
        entityRef: 'component:default/service-b',
      },
      {
        id: 'component:default/service-c',
        name: 'Service C',
        pathname: '/catalog/default/component/service-c',
        entityRef: 'component:default/service-c',
      },
      { id: 'short', name: 'short', pathname: '/short' },
      {
        id: 'long-application-name',
        name: 'long-application-name',
        pathname: '/long-application-name',
      },
    ];
    const visits = links.map(link => ({
      ...link,
      hits: link.id.length,
      timestamp: Date.now() - link.id.length * 1000 * 60,
    }));
    if (
      queryParams?.orderBy?.[0]?.field === 'timestamp' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (
      queryParams?.orderBy?.[0]?.field === 'hits' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.hits - a.hits);
    }
    return visits;
  }

  async save(saveParams: VisitsApiSaveParams): Promise<Visit> {
    const { visit } = saveParams;
    return {
      ...visit,
      id: visit.pathname ?? visit.name ?? 'mock-visit',
      hits: 1,
      timestamp: Date.now(),
    };
  }
}

export const mockCatalogApi = catalogApiMock({ entities });

export const mockStarredEntitiesApi = new MockStarredEntitiesApi();
mockStarredEntitiesApi.toggleStarred('component:default/service-a');
mockStarredEntitiesApi.toggleStarred('component:default/service-b');

export const mockSearchApi = new MockSearchApi();
