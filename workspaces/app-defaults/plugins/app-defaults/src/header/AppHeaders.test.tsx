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

import { AppHeaders, sortAppHeaders } from './AppHeaders';

const Banner = () => <div>Banner</div>;
const Toolbar = () => <div>Toolbar</div>;
const Crashing = () => {
  throw new Error('boom');
};

describe('sortAppHeaders', () => {
  it('orders by priority, higher first, then by id', () => {
    const sorted = sortAppHeaders([
      { id: 'c', component: Banner },
      { id: 'b', component: Banner, priority: 10 },
      { id: 'a', component: Banner },
      { id: 'd', component: Banner, priority: -10 },
    ]);
    expect(sorted.map(h => h.id)).toEqual(['b', 'a', 'c', 'd']);
  });
});

describe('AppHeaders', () => {
  it('renders nothing without headers', async () => {
    const { container } = await renderInTestApp(<AppHeaders headers={[]} />);
    expect(container.querySelector('#rhdh-app-headers')).toBeNull();
  });

  it('renders headers ordered by priority', async () => {
    await renderInTestApp(
      <AppHeaders
        headers={[
          { id: 'toolbar', component: Toolbar, priority: 0 },
          { id: 'banner', component: Banner, priority: 100 },
        ]}
      />,
    );

    const root = document.getElementById('rhdh-app-headers')!;
    expect(root.textContent).toBe('BannerToolbar');
  });

  it('isolates a crashing header', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderInTestApp(
      <AppHeaders
        headers={[
          { id: 'crashing', component: Crashing, priority: 10 },
          { id: 'banner', component: Banner },
        ]}
      />,
    );

    expect(screen.getByText('Banner')).toBeInTheDocument();
    jest.restoreAllMocks();
  });
});
