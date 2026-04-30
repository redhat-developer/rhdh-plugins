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

import { MenuItemLink } from '../../components/MenuItemLink/MenuItemLink';
import type { GlobalHeaderMenuItemData } from '../types';
import { groupBySection, buildDropdownEntries } from './menuItemGrouping';

const DummyComponent = () => null;

function makeDataItem(
  overrides: Partial<GlobalHeaderMenuItemData> = {},
): GlobalHeaderMenuItemData {
  return {
    target: 'test',
    type: 'data',
    title: 'Item',
    ...overrides,
  };
}

describe('groupBySection', () => {
  it('groups items by sectionLabel', () => {
    const items = [
      makeDataItem({ sectionLabel: 'A', title: 'A1' }),
      makeDataItem({ sectionLabel: 'B', title: 'B1' }),
      makeDataItem({ sectionLabel: 'A', title: 'A2' }),
    ];

    const groups = groupBySection(items);

    expect(groups).toHaveLength(2);
    expect(groups[0].sectionLabel).toBe('A');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].sectionLabel).toBe('B');
    expect(groups[1].items).toHaveLength(1);
  });

  it('defaults items without sectionLabel to empty string', () => {
    const groups = groupBySection([makeDataItem({ title: 'No label' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].sectionLabel).toBe('');
  });

  it('takes section metadata from the first item in the group', () => {
    const items = [
      makeDataItem({
        sectionLabel: 'docs',
        sectionLink: '/docs',
        sectionLinkLabel: 'View all',
      }),
      makeDataItem({
        sectionLabel: 'docs',
        sectionLink: '/other',
        sectionLinkLabel: 'Other',
      }),
    ];

    const groups = groupBySection(items);
    expect(groups[0].sectionLink).toBe('/docs');
    expect(groups[0].sectionLinkLabel).toBe('View all');
  });

  it('uses max priority across items in a group', () => {
    const items = [
      makeDataItem({ sectionLabel: 'sec', priority: 10 }),
      makeDataItem({ sectionLabel: 'sec', priority: 50 }),
      makeDataItem({ sectionLabel: 'sec', priority: 30 }),
    ];

    const groups = groupBySection(items);
    expect(groups[0].priority).toBe(50);
  });

  it('defaults to MenuItemLink when no component is supplied', () => {
    const groups = groupBySection([makeDataItem()]);
    expect(groups[0].items[0].Component).toBe(MenuItemLink);
  });

  it('uses provided component when supplied', () => {
    const groups = groupBySection([
      makeDataItem({ component: DummyComponent }),
    ]);
    expect(groups[0].items[0].Component).toBe(DummyComponent);
  });

  it('maps item fields to MenuItemConfig correctly', () => {
    const onClick = jest.fn();
    const items = [
      makeDataItem({
        title: 'Title',
        titleKey: 'key.title',
        icon: 'home',
        subTitle: 'Sub',
        subTitleKey: 'key.sub',
        link: '/home',
        onClick,
      }),
    ];

    const config = groupBySection(items)[0].items[0];
    expect(config.label).toBe('Title');
    expect(config.labelKey).toBe('key.title');
    expect(config.icon).toBe('home');
    expect(config.subLabel).toBe('Sub');
    expect(config.subLabelKey).toBe('key.sub');
    expect(config.link).toBe('/home');
    expect(config.onClick).toBe(onClick);
  });

  it('returns empty array for empty input', () => {
    expect(groupBySection([])).toEqual([]);
  });
});

describe('buildDropdownEntries', () => {
  it('returns empty array for empty input', () => {
    expect(buildDropdownEntries([])).toEqual([]);
  });

  it('separates component items from data items', () => {
    const items: GlobalHeaderMenuItemData[] = [
      {
        target: 't',
        type: 'component',
        component: DummyComponent,
        priority: 10,
      },
      makeDataItem({ priority: 5 }),
    ];

    const entries = buildDropdownEntries(items);
    expect(entries).toHaveLength(2);
    expect(entries.find(e => e.type === 'component')).toBeDefined();
    expect(entries.find(e => e.type === 'section')).toBeDefined();
  });

  it('sorts entries by descending priority', () => {
    const items: GlobalHeaderMenuItemData[] = [
      makeDataItem({ sectionLabel: 'low', priority: 10 }),
      {
        target: 't',
        type: 'component',
        component: DummyComponent,
        priority: 50,
      },
      makeDataItem({ sectionLabel: 'mid', priority: 30 }),
    ];

    const entries = buildDropdownEntries(items);
    const priorities = entries.map(e => e.priority);
    expect(priorities).toEqual([50, 30, 10]);
  });

  it('defaults priority to 0 for items without priority', () => {
    const items: GlobalHeaderMenuItemData[] = [
      { target: 't', type: 'component', component: DummyComponent },
    ];

    const entries = buildDropdownEntries(items);
    expect(entries[0].priority).toBe(0);
  });
});
