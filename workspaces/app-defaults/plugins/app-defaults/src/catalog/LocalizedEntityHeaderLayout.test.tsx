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

import { render, screen, within } from '@testing-library/react';

import { LocalizedEntityHeaderLayout } from './LocalizedEntityHeaderLayout';

// Known translations used by the mocked `t`. Individual tab titles live under
// `catalog.entityTabs.*`, group titles under `catalog.entityTabGroups.*`.
const messages: Record<string, string> = {
  'catalog.entityTabs.Overview': 'Übersicht',
  'catalog.entityTabs.Docs': 'Dokumentation',
  'catalog.entityTabGroups.Deployment': 'Bereitstellung',
  'catalog.entityTabs.Mend_io': 'Mend',
};

// Mirrors the i18next fallback the component relies on: return the translation
// for a known key, otherwise the provided default value.
jest.mock('@backstage/core-plugin-api/alpha', () => ({
  useTranslationRef: () => ({
    t: (key: string, options: { defaultValue: string }) =>
      messages[key] ?? options.defaultValue,
  }),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-app-react', () => ({
  appReactTranslationRef: { id: 'plugin.app-react' },
}));

// Render the tabs the layout passes down so the translated labels are
// observable, plus a marker for a passed-through prop.
jest.mock('@red-hat-developer-hub/backstage-plugin-app-react/alpha', () => ({
  EntityHeaderBui: (props: any) => (
    <div data-testid="entity-header-bui" data-active={props.activeTabId}>
      {props.tabs.map((tab: any) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          <span data-testid="tab-label">{tab.label}</span>
          {tab.items?.map((item: any) => (
            <span key={item.id} data-testid="item-label">
              {item.label}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

const renderLayout = (tabs: any[], activeTabId?: string) =>
  render(<LocalizedEntityHeaderLayout {...({ tabs, activeTabId } as any)} />);

describe('LocalizedEntityHeaderLayout', () => {
  it('localizes a known individual tab title', () => {
    renderLayout([{ id: 'overview', label: 'Overview', href: 'overview' }]);

    expect(screen.getByTestId('tab-overview')).toHaveTextContent('Übersicht');
  });

  it('falls back to the group namespace when the tab namespace has no match', () => {
    renderLayout([{ id: 'deployment', label: 'Deployment', href: 'deploy' }]);

    // 'Deployment' is only defined under catalog.entityTabGroups.
    expect(screen.getByTestId('tab-deployment')).toHaveTextContent(
      'Bereitstellung',
    );
  });

  it('falls back to the original label when no translation exists', () => {
    renderLayout([{ id: 'custom', label: 'My Plugin', href: 'custom' }]);

    expect(screen.getByTestId('tab-custom')).toHaveTextContent('My Plugin');
  });

  it('translates group labels and their nested item labels', () => {
    renderLayout([
      {
        id: 'group',
        label: 'Deployment',
        items: [
          { id: 'docs', label: 'Docs', href: 'docs' },
          { id: 'unknown', label: 'Custom Item', href: 'unknown' },
        ],
      },
    ]);

    const group = screen.getByTestId('tab-group');
    expect(within(group).getByTestId('tab-label')).toHaveTextContent(
      'Bereitstellung',
    );
    const items = within(group)
      .getAllByTestId('item-label')
      .map(node => node.textContent);
    expect(items).toEqual(['Dokumentation', 'Custom Item']);
  });

  it('replaces dots in the label so dotted titles stay a single key', () => {
    renderLayout([{ id: 'mend', label: 'Mend.io', href: 'mend' }]);

    // Looked up under `catalog.entityTabs.Mend_io`.
    expect(screen.getByTestId('tab-mend')).toHaveTextContent('Mend');
  });

  it('passes other props through to EntityHeaderBui', () => {
    renderLayout(
      [{ id: 'overview', label: 'Overview', href: 'overview' }],
      'overview',
    );

    expect(screen.getByTestId('entity-header-bui')).toHaveAttribute(
      'data-active',
      'overview',
    );
  });
});
