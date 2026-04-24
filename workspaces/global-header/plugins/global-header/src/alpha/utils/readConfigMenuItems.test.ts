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

import { ConfigReader } from '@backstage/config';
import { readConfigMenuItems } from './readConfigMenuItems';

describe('readConfigMenuItems', () => {
  it('returns empty array when globalHeader.menuItems is absent', () => {
    const config = new ConfigReader({});
    expect(readConfigMenuItems(config)).toEqual([]);
  });

  it('maps config entries to GlobalHeaderMenuItemData', () => {
    const config = new ConfigReader({
      globalHeader: {
        menuItems: [
          {
            target: 'help',
            title: 'Documentation',
            icon: 'docs',
            link: 'https://docs.example.com',
            sectionLabel: 'Resources',
            sectionLink: '/resources',
            sectionLinkLabel: 'View all',
            priority: 100,
          },
        ],
      },
    });

    const items = readConfigMenuItems(config);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      target: 'help',
      type: 'data',
      title: 'Documentation',
      titleKey: undefined,
      icon: 'docs',
      link: 'https://docs.example.com',
      sectionLabel: 'Resources',
      sectionLink: '/resources',
      sectionLinkLabel: 'View all',
      priority: 100,
    });
  });

  it('handles optional fields being absent', () => {
    const config = new ConfigReader({
      globalHeader: {
        menuItems: [
          {
            target: 'app-launcher',
            title: 'My App',
            link: '/my-app',
          },
        ],
      },
    });

    const items = readConfigMenuItems(config);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      target: 'app-launcher',
      type: 'data',
      title: 'My App',
      link: '/my-app',
    });
    expect(items[0].titleKey).toBeUndefined();
    expect(items[0].icon).toBeUndefined();
    expect(items[0].sectionLabel).toBeUndefined();
    expect(items[0].priority).toBeUndefined();
  });

  it('handles multiple items', () => {
    const config = new ConfigReader({
      globalHeader: {
        menuItems: [
          { target: 'help', title: 'FAQ', link: '/faq' },
          { target: 'help', title: 'Support', link: '/support' },
          { target: 'app-launcher', title: 'App', link: '/app' },
        ],
      },
    });

    const items = readConfigMenuItems(config);
    expect(items).toHaveLength(3);
    expect(items.map(i => i.target)).toEqual(['help', 'help', 'app-launcher']);
  });
});
