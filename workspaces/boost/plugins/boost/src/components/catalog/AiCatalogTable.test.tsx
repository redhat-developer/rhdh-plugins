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

import type { Entity } from '@backstage/catalog-model';
import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';

import { boostMessages } from '../../translations/ref';
import { AiCatalogTable } from './AiCatalogTable';

const { catalog: msg } = boostMessages;

const entities: Entity[] = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'code-review-skill',
      title: 'Code Review Skill',
      description: 'Automated code review.',
      namespace: 'default',
      uid: 'uid-1',
      annotations: { 'rhdh.io/ai-asset-source': 'github' },
    },
    spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
  },
];

describe('AiCatalogTable', () => {
  it('renders column headers and entity fields', async () => {
    await renderInTestApp(
      <AiCatalogTable
        entities={entities}
        sort={{ descriptor: null, onSortChange: jest.fn() }}
      />,
    );

    expect(screen.getByText(msg.table.name)).toBeInTheDocument();
    expect(screen.getByText(msg.table.type)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Code Review Skill' }),
    ).toHaveAttribute('href', '/catalog/default/airesource/code-review-skill');
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('team-ai')).toBeInTheDocument();
    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('Automated code review.')).toBeInTheDocument();
  });
});
