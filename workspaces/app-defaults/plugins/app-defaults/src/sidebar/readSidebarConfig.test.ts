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

import { mockApis } from '@backstage/frontend-test-utils';

import {
  readConfigSidebarGroups,
  readConfigSidebarItems,
} from './readSidebarConfig';

describe('readConfigSidebarItems', () => {
  it('returns no items when app.sidebar is not configured', () => {
    expect(readConfigSidebarItems(mockApis.config({ data: {} }))).toEqual([]);
    expect(
      readConfigSidebarItems(
        mockApis.config({ data: { app: { sidebar: {} } } }),
      ),
    ).toEqual([]);
  });

  it('maps configured items and keys them by their config path', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            items: [
              {
                title: 'Audit log',
                icon: 'history',
                to: '/audit-log',
                priority: 5,
                group: 'admin',
                requiresRoute: true,
              },
              { title: 'Docs', to: 'https://example.com/docs' },
            ],
          },
        },
      },
    });

    expect(readConfigSidebarItems(configApi)).toEqual([
      {
        id: 'app.sidebar.items[0]',
        title: 'Audit log',
        icon: 'history',
        to: '/audit-log',
        priority: 5,
        group: 'admin',
        requiresRoute: true,
      },
      {
        id: 'app.sidebar.items[1]',
        title: 'Docs',
        icon: undefined,
        to: 'https://example.com/docs',
        priority: undefined,
        group: undefined,
        requiresRoute: undefined,
      },
    ]);
  });

  it('rejects items without a title', () => {
    const configApi = mockApis.config({
      data: { app: { sidebar: { items: [{ to: '/nowhere' }] } } },
    });

    expect(() => readConfigSidebarItems(configApi)).toThrow(/title/);
  });

  it('rejects items without a link, since config items cannot have onClick', () => {
    const configApi = mockApis.config({
      data: { app: { sidebar: { items: [{ title: 'Nowhere' }] } } },
    });

    expect(() => readConfigSidebarItems(configApi)).toThrow(/to/);
  });

  it('flattens items from app.sidebar.plugins.<pluginName> with the top-level ones', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            items: [{ title: 'Docs', to: 'https://example.com/docs' }],
            plugins: {
              rbac: {
                items: [
                  {
                    title: 'RBAC',
                    to: '/rbac',
                    group: 'admin',
                    requiresRoute: true,
                  },
                ],
              },
              'my-plugin': {
                groups: [{ id: 'tools', title: 'Tools' }],
                items: [
                  { title: 'Grafana', to: '/grafana', group: 'tools' },
                  { title: 'Kibana', to: '/kibana', group: 'tools' },
                ],
              },
            },
          },
        },
      },
    });

    expect(
      readConfigSidebarItems(configApi).map(({ id, title }) => ({
        id,
        title,
      })),
    ).toEqual([
      { id: 'app.sidebar.plugins.rbac.items[0]', title: 'RBAC' },
      { id: 'app.sidebar.plugins.my-plugin.items[0]', title: 'Grafana' },
      { id: 'app.sidebar.plugins.my-plugin.items[1]', title: 'Kibana' },
      { id: 'app.sidebar.items[0]', title: 'Docs' },
    ]);
  });

  it('reads plugin entries when there are no top-level items', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            plugins: {
              rbac: { items: [{ title: 'RBAC', to: '/rbac' }] },
            },
          },
        },
      },
    });

    expect(readConfigSidebarItems(configApi)).toHaveLength(1);
  });
});

describe('readConfigSidebarGroups', () => {
  it('returns no groups when app.sidebar is not configured', () => {
    expect(readConfigSidebarGroups(mockApis.config({ data: {} }))).toEqual([]);
  });

  it('maps configured groups and keeps their id', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            groups: [
              {
                id: 'tools',
                title: 'Tools',
                icon: 'extension',
                to: '/tools',
                priority: -5,
                variant: 'flyout',
              },
              { id: 'admin', title: 'Admin' },
            ],
          },
        },
      },
    });

    expect(readConfigSidebarGroups(configApi)).toEqual([
      {
        id: 'tools',
        title: 'Tools',
        icon: 'extension',
        to: '/tools',
        priority: -5,
        variant: 'flyout',
      },
      {
        id: 'admin',
        title: 'Admin',
        icon: undefined,
        to: undefined,
        priority: undefined,
        variant: undefined,
      },
    ]);
  });

  it('falls back to the default variant for unknown values', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            groups: [{ id: 'tools', title: 'Tools', variant: 'popover' }],
          },
        },
      },
    });

    expect(readConfigSidebarGroups(configApi)[0].variant).toBeUndefined();
  });

  it('rejects groups without an id', () => {
    const configApi = mockApis.config({
      data: { app: { sidebar: { groups: [{ title: 'Tools' }] } } },
    });

    expect(() => readConfigSidebarGroups(configApi)).toThrow(/id/);
  });

  it('lists plugin groups before the top-level ones so the top level overrides', () => {
    const configApi = mockApis.config({
      data: {
        app: {
          sidebar: {
            groups: [{ id: 'tools', title: 'Tooling' }],
            plugins: {
              'my-plugin': { groups: [{ id: 'tools', title: 'Tools' }] },
            },
          },
        },
      },
    });

    expect(
      readConfigSidebarGroups(configApi).map(group => group.title),
    ).toEqual(['Tools', 'Tooling']);
  });
});
