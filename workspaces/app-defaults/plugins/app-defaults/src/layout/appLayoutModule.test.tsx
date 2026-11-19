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
import {
  coreExtensionData,
  createExtension,
} from '@backstage/frontend-plugin-api';
import {
  createExtensionTester,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import {
  AppDrawerContentBlueprint,
  AppHeaderBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { appLayoutExtension } from './appLayoutModule';

// createExtensionTester resolves ids without a plugin namespace, so the
// subject becomes `layout` instead of `app/layout`.
const headersInput = { id: 'layout', input: 'headers' } as const;
const drawersInput = { id: 'layout', input: 'drawers' } as const;

const navExtension = createExtension({
  name: 'nav',
  attachTo: { id: 'layout', input: 'nav' },
  output: [coreExtensionData.reactElement],
  factory: () => [coreExtensionData.reactElement(<nav>Sidebar</nav>)],
});

const contentExtension = createExtension({
  name: 'content',
  attachTo: { id: 'layout', input: 'content' },
  output: [coreExtensionData.reactElement],
  factory: () => [coreExtensionData.reactElement(<main>Content</main>)],
});

const Banner = () => <div>Banner</div>;
const Toolbar = () => <div>Toolbar</div>;

describe('appLayoutExtension', () => {
  it('overrides the app layout', () => {
    const spec = JSON.parse(JSON.stringify(appLayoutExtension));

    expect(spec.kind).toBeUndefined();
    expect(spec.name).toBe('layout');
    expect(spec.attachTo).toEqual({ id: 'app/root', input: 'children' });
  });

  it('renders headers above the sidebar, content and drawer', async () => {
    const tester = createExtensionTester(appLayoutExtension)
      .add(navExtension)
      .add(contentExtension)
      .add(
        AppHeaderBlueprint.make({
          attachTo: headersInput,
          name: 'toolbar',
          params: { component: Toolbar },
        }),
      )
      .add(
        AppHeaderBlueprint.make({
          attachTo: headersInput,
          name: 'banner',
          params: { component: Banner, priority: 100 },
        }),
      )
      .add(
        AppDrawerContentBlueprint.make({
          attachTo: drawersInput,
          name: 'chat',
          params: { id: 'chat', element: <div>Chat</div> },
        }),
      );

    await renderInTestApp(tester.get(coreExtensionData.reactElement));

    const headers = document.getElementById('rhdh-app-headers')!;
    expect(headers.textContent).toBe('BannerToolbar');

    const layout = document.getElementById('rhdh-app-layout')!;
    expect(layout.firstElementChild).toBe(headers);

    const nav = screen.getByRole('navigation');
    const main = screen.getByRole('main');
    expect(
      headers.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The (closed) drawer panel is docked next to the content.
    const row = layout.lastElementChild!;
    expect(row.contains(main)).toBe(true);
    expect(row.querySelector('[class*="MuiDrawer-docked"]')).not.toBeNull();
  });

  it('renders without headers and drawers', async () => {
    const tester = createExtensionTester(appLayoutExtension)
      .add(navExtension)
      .add(contentExtension);

    await renderInTestApp(tester.get(coreExtensionData.reactElement));

    expect(document.getElementById('rhdh-app-headers')).toBeNull();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
