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
import type { CatalogApi } from '@backstage/plugin-catalog-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';

import { boostMessages } from '../../translations/ref';
import { AiCatalogPage } from './AiCatalogPage';

const { catalog: msg } = boostMessages;

const mockEntities: Entity[] = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'code-review-skill',
      title: 'Code Review Skill',
      description: 'Automated code review.',
      namespace: 'default',
      uid: 'uid-1',
      tags: ['security'],
      annotations: { 'rhdh.io/ai-asset-source': 'github' },
    },
    spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'dev-assistant',
      title: 'Developer Assistant',
      description: 'AI agent for developers.',
      namespace: 'default',
      uid: 'uid-2',
      tags: ['agent'],
      annotations: {},
    },
    spec: { type: 'ai-agent', lifecycle: 'experimental', owner: 'team-ai' },
  },
];

const mockCatalogApi: Pick<jest.Mocked<CatalogApi>, 'getEntities'> = {
  getEntities: jest.fn(),
};

function renderPage() {
  return renderInTestApp(
    <TestApiProvider
      apis={[[catalogApiRef, mockCatalogApi as unknown as CatalogApi]]}
    >
      <AiCatalogPage />
    </TestApiProvider>,
  );
}

describe('AiCatalogPage', () => {
  beforeEach(() => {
    mockCatalogApi.getEntities.mockReset();
  });

  it('shows loading skeletons while fetching', async () => {
    mockCatalogApi.getEntities.mockReturnValue(new Promise(() => {}));
    await renderPage();
    expect(screen.getAllByTestId('loading-skeleton').length).toBeGreaterThan(0);
  });

  it('renders card grid with entities', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({ items: mockEntities });
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Code Review Skill')).toBeInTheDocument();
    });
    expect(screen.getByText('Developer Assistant')).toBeInTheDocument();
    expect(
      screen.getByText(`${msg.toolbar.allPrefix} (2)`),
    ).toBeInTheDocument();
  });

  it('shows empty state when no assets and no filters', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({ items: [] });
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(msg.empty.title)).toBeInTheDocument();
    });
    expect(screen.getByText(msg.empty.learnMore)).toBeInTheDocument();
  });

  it('shows error state with retry when catalog fails', async () => {
    mockCatalogApi.getEntities.mockRejectedValue(new Error('Network error'));
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(msg.error.title)).toBeInTheDocument();
    });
    expect(screen.getByText(msg.error.retry)).toBeInTheDocument();
  });

  it('renders search field and count', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({ items: mockEntities });
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Code Review Skill')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(msg.toolbar.search)).toBeInTheDocument();
    expect(
      screen.getByText(`${msg.toolbar.allPrefix} (2)`),
    ).toBeInTheDocument();
  });
});
