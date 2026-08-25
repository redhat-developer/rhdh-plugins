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

import { render, screen } from '@testing-library/react';
import { ConfigReader } from '@backstage/config';
import { readConfigComponents } from './readConfigComponents';

jest.mock('../components/HeaderIconButton/HeaderIconButton', () => ({
  HeaderIconButton: ({ title, to }: { title: string; to: string }) => (
    <a href={to} aria-label={title} />
  ),
}));

describe('readConfigComponents', () => {
  it('returns empty array when globalHeader.components is absent', () => {
    const config = new ConfigReader({});
    expect(readConfigComponents(config)).toEqual([]);
  });

  it('maps config entries to GlobalHeaderComponentData with correct priority', () => {
    const config = new ConfigReader({
      globalHeader: {
        components: [
          {
            title: 'Dashboard',
            icon: 'dashboard',
            link: '/dashboard',
            priority: 75,
          },
          { title: 'Wiki', icon: 'article', link: 'https://wiki.example.com' },
        ],
      },
    });

    const result = readConfigComponents(config);
    expect(result).toHaveLength(2);
    expect(result[0].priority).toBe(75);
    expect(result[0].component).toBeDefined();
    expect(result[1].priority).toBeUndefined();
  });

  it('renders a HeaderIconButton with the configured props', async () => {
    const config = new ConfigReader({
      globalHeader: {
        components: [
          {
            title: 'My Tool',
            icon: 'build',
            link: '/my-tool',
            tooltip: 'Open My Tool',
          },
        ],
      },
    });

    const [item] = readConfigComponents(config);
    const Comp = item.component;

    render(<Comp />);

    expect(await screen.findByRole('link')).toHaveAttribute('href', '/my-tool');
    expect(screen.getByLabelText('My Tool')).toBeInTheDocument();
  });
});
