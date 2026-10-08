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
import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { BreadcrumbEntry } from '@backstage/frontend-plugin-api';

// Localize titles by mapping the `pages.<title>` / `pageTabs.<title>` keys,
// mirroring the runtime lookup. Unknown keys fall back to the default value.
const messages: Record<string, string> = {
  'pages.Settings': 'Einstellungen',
  'pageTabs.General': 'Allgemein',
  'pageTabs.Feature Flags': 'Feature-Flags',
};

jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  useTranslationRef: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      messages[key] ?? options?.defaultValue ?? key,
  }),
}));

// eslint-disable-next-line import/first
import { LocalizedPageLayout } from './LocalizedPageLayout';

describe('LocalizedPageLayout', () => {
  it('localizes the title and known tab labels, leaves unknown ones unchanged', async () => {
    await renderInTestApp(
      <LocalizedPageLayout
        title="Settings"
        tabs={[
          { id: 'general', label: 'General', href: 'general' },
          {
            id: 'feature-flags',
            label: 'Feature Flags',
            href: 'feature-flags',
          },
          { id: 'custom', label: 'My Plugin Tab', href: 'custom' },
        ]}
      >
        <div>content</div>
      </LocalizedPageLayout>,
    );

    // The title is rendered as heading and as the current breadcrumb.
    expect(
      screen.getByRole('heading', { name: 'Einstellungen' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual([
      'Allgemein',
      'Feature-Flags',
      'My Plugin Tab',
    ]);
    // Relative tab hrefs are resolved against the current route.
    expect(tabs[0]).toHaveAttribute('href', '/general');

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('localizes breadcrumb entries contributed by parent pages', async () => {
    await renderInTestApp(
      <BreadcrumbEntry entry={{ label: 'Settings', href: '/settings' }}>
        <BreadcrumbEntry
          entry={{ label: 'General', href: '/settings/general' }}
        >
          <LocalizedPageLayout title="Details">
            <div>content</div>
          </LocalizedPageLayout>
        </BreadcrumbEntry>
      </BreadcrumbEntry>,
    );

    expect(screen.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(screen.getByRole('link', { name: 'Allgemein' })).toHaveAttribute(
      'href',
      '/settings/general',
    );
    expect(
      screen.getByRole('heading', { name: 'Details' }),
    ).toBeInTheDocument();
  });

  it('renders only the children when the header is disabled', async () => {
    await renderInTestApp(
      <LocalizedPageLayout title="Settings" noHeader>
        <div>content</div>
      </LocalizedPageLayout>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
