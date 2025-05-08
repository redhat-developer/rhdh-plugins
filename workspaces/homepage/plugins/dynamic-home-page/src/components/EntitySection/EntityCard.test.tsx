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
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import EntityCard from './EntityCard';

jest.mock('./TagList', () => (props: any) => (
  <div data-testid="tag-list">
    {props.kind} - {props.tags.join(', ')}
  </div>
));

describe('EntityCard', () => {
  const props = {
    link: '/entity/example',
    title: 'Example Entity',
    description: 'This is a test description for the entity card.',
    tags: ['API', 'Java'],
    kind: 'Component',
  };

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <EntityCard {...props} />
      </MemoryRouter>,
    );

  it('should render the entity title as a link', () => {
    renderComponent();
    const titleLink = screen.getByRole('link', { name: /example entity/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', props.link);
  });

  it('should render the entity description', () => {
    renderComponent();
    expect(screen.getByText(/this is a test description/i)).toBeInTheDocument();
  });

  it('should render the TagList with kind and tags', () => {
    renderComponent();
    expect(screen.getByTestId('tag-list')).toHaveTextContent(
      'Component - API, Java',
    );
  });
});
