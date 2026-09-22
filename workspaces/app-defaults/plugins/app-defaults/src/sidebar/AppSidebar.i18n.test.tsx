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

// Localize sidebar titles by mapping the `pages.<title>` keys, mirroring the
// runtime lookup. Unknown keys fall back to the provided default value.
const messages: Record<string, string> = {
  'pages.Catalog': 'Katalog',
  'pages.Settings': 'Einstellungen',
};

jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  useTranslationRef: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      messages[key] ?? options?.defaultValue ?? key,
  }),
}));

// eslint-disable-next-line import/first
import { AppSidebar } from './AppSidebar';

describe('AppSidebar localization', () => {
  it('localizes known page titles and leaves unknown ones unchanged', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'catalog', title: 'Catalog', to: '/catalog' },
          { id: 'chat', title: 'Chat', to: '/chat' },
        ]}
        groups={[
          { id: 'settings', title: 'Settings', to: '/settings', priority: -1 },
        ]}
      />,
    );

    const links = screen.getAllByRole('link');
    const texts = links.map(l => l.textContent);
    expect(texts).toContain('Katalog'); // Catalog -> localized
    expect(texts).toContain('Einstellungen'); // Settings group -> localized
    expect(texts).toContain('Chat'); // unknown -> unchanged
    expect(texts).not.toContain('Catalog');
  });
});
