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

import { QuickAccessToolkitList } from './QuickAccessToolkitList';

describe('QuickAccessToolkitList', () => {
  it('renders links inside list items for accessibility', () => {
    const { container } = render(
      <QuickAccessToolkitList
        tools={[
          {
            label: 'Website',
            url: 'https://example.com',
            icon: <span data-testid="icon" />,
          },
        ]}
      />,
    );

    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();

    const listItem = list?.querySelector('li');
    expect(listItem).toBeInTheDocument();
    expect(listItem?.querySelector('a')).toHaveAttribute(
      'href',
      'https://example.com',
    );

    expect(screen.getByText('Website')).toBeInTheDocument();
  });
});
