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
import { Page, expect } from '@playwright/test';

function getEventsUrl(page: Page) {
  const url = new URL(page.url());
  // Map frontend port to backend port:
  // 3000 -> 7007, 3001 -> 7008, 3002 -> 7009, 3003 -> 7010
  const frontendPort = parseInt(url.port, 10);
  const backendPort = frontendPort + 4007;
  return `${url.protocol}//${url.hostname}:${backendPort}/api/adoption-insights/events`;
}

export async function visitComponent(
  page: Page,
  auth: string,
  component: string,
) {
  const date = new Date().toISOString();
  const resp = await page.request.post(getEventsUrl(page), {
    headers: {
      authorization: auth,
    },
    data: [
      {
        action: 'click',
        subject: `/catalog/default/component/${component}`,
        attributes: {
          to: `/catalog/default/component/${component}`,
        },
        context: {
          routeRef: 'catalog',
          pluginId: 'catalog',
          extension: 'CatalogIndexPage',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
      {
        action: 'navigate',
        subject: `/catalog/default/component/${component}`,
        attributes: {
          namespace: 'default',
          kind: 'component',
          name: component,
        },
        context: {
          routeRef: 'catalog:entity',
          pluginId: 'catalog',
          extension: 'App',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
    ],
  });
  expect(resp.ok()).toBeTruthy();
}

export async function runTemplate(page: Page, auth: string) {
  const date = new Date().toISOString();
  const resp = await page.request.post(getEventsUrl(page), {
    headers: {
      authorization: auth,
    },
    data: [
      {
        action: 'click',
        subject: 'Create',
        context: {
          routeRef: 'scaffolder',
          pluginId: 'scaffolder',
          extension: 'ScaffolderPage',
          entityRef: 'template:default/example-nodejs-template',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
      {
        action: 'create',
        subject: 'Task has been created',
        attributes: {
          templateSteps: 2,
        },
        context: {
          routeRef: 'scaffolder',
          pluginId: 'scaffolder',
          extension: 'ScaffolderPage',
          entityRef: 'template:default/example-nodejs-template',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
      {
        action: 'navigate',
        subject: '/create/tasks/b12e470a-7a5d-46c8-a148-811cd05d558d',
        attributes: {},
        context: {
          routeRef: 'scaffolder',
          pluginId: 'scaffolder',
          extension: 'App',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
    ],
  });
  expect(resp.ok()).toBeTruthy();
}

export async function visitDocs(page: Page, auth: string) {
  const date = new Date().toISOString();
  const resp = await page.request.post(getEventsUrl(page), {
    headers: {
      authorization: auth,
    },
    data: [
      {
        action: 'click',
        subject: 'Docs',
        attributes: { to: '/docs' },
        context: {
          routeRef: 'unknown',
          pluginId: 'root',
          extension: 'App',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
      {
        action: 'navigate',
        subject: '/docs',
        attributes: {},
        context: {
          routeRef: 'techdocs:index-page',
          pluginId: 'techdocs',
          extension: 'App',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
    ],
  });
  expect(resp.ok()).toBeTruthy();
}

export async function performSearch(
  page: Page,
  auth: string,
  searchPhrase: string,
) {
  const date = new Date().toISOString();
  const resp = await page.request.post(getEventsUrl(page), {
    headers: {
      authorization: auth,
    },
    data: [
      {
        action: 'click',
        subject: 'Search',
        attributes: { to: '/' },
        context: {
          routeRef: 'unknown',
          pluginId: 'search',
          extension: 'SidebarSearchModal',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
      {
        action: 'search',
        subject: searchPhrase,
        value: 0,
        context: {
          routeRef: 'unknown',
          pluginId: 'search',
          extension: 'SidebarSearchModal',
          userName: 'user:development/guest',
          userId:
            'edf9b585cd547bd4d13e21375202ef43adaa479c4627d70db6d64e0407e11087',
          timestamp: date,
        },
      },
    ],
  });
  expect(resp.ok()).toBeTruthy();
}
