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
import { Entity } from '@backstage/catalog-model';

import EntityCard from './EntityCard';

jest.mock('@backstage/plugin-catalog-react', () => ({
  EntityRefLink: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('./TagList', () => ({
  __esModule: true,
  default: ({ kind, tags }: { kind: string; tags: string[] }) => (
    <div data-testid="tag-list">{`Kind: ${kind}, Tags: ${tags.join(', ')}`}</div>
  ),
}));

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-service',
    namespace: 'default',
  },
  spec: {},
};

const defaultProps = {
  title: 'red-hat-developer-hub-homepage',
  description: 'This is a description of the test service.',
  tags: ['api', 'rhdh'],
  kind: 'Component',
  entity: mockEntity,
};

describe('<EntityCard />', () => {
  it('renders title, description, and tags', () => {
    render(
      <MemoryRouter>
        <EntityCard {...defaultProps} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('red-hat-developer-hub-homepage'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This is a description of the test service.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('tag-list')).toHaveTextContent(
      'Kind: Component, Tags: api, rhdh',
    );
  });
});
