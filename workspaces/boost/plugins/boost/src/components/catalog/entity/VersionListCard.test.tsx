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
import { catalogApiRef, EntityProvider } from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';

import { VersionListCard } from './VersionListCard';

const currentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    uid: 'uid-v120',
    annotations: {
      'rhdh.io/ai-asset-version': '1.2.0',
      'rhdh.io/ai-asset-name': 'code-review-skill',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
  },
};

const olderSibling: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill-v1',
    namespace: 'default',
    uid: 'uid-v100',
    annotations: {
      'rhdh.io/ai-asset-version': '1.0.0',
      'rhdh.io/ai-asset-name': 'code-review-skill',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
  },
};

const middleSibling: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill-v11',
    namespace: 'default',
    uid: 'uid-v110',
    annotations: {
      'rhdh.io/ai-asset-version': '1.1.0',
      'rhdh.io/ai-asset-name': 'code-review-skill',
      'rhdh.io/ai-asset-recommended': 'true',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
  },
};

const noVersionEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'no-version-asset',
    namespace: 'default',
    uid: 'uid-noversion',
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
  },
};

const mockCatalogApi: Pick<jest.Mocked<CatalogApi>, 'getEntities'> = {
  getEntities: jest.fn(),
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <TestApiProvider
      apis={[[catalogApiRef, mockCatalogApi as unknown as CatalogApi]]}
    >
      <EntityProvider entity={entity}>
        <VersionListCard />
      </EntityProvider>
    </TestApiProvider>,
  );
}

describe('VersionListCard', () => {
  beforeEach(() => {
    mockCatalogApi.getEntities.mockReset();
  });

  it('returns null when entity has no version annotation', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({ items: [] });
    const { container } = await renderWithEntity(noVersionEntity);

    expect(container.innerHTML).toBe('');
  });

  it('renders single version with current label when only one version exists', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [currentEntity],
    });

    await renderWithEntity(currentEntity);

    await waitFor(() => {
      expect(screen.getByText('1.2.0')).toBeInTheDocument();
    });
    expect(screen.getByText('current')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders all versions with current marked and navigation for others', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [olderSibling, currentEntity, middleSibling],
    });

    await renderWithEntity(currentEntity);

    await waitFor(() => {
      expect(screen.getByText('1.2.0')).toBeInTheDocument();
    });
    expect(screen.getByText('1.1.0')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('current')).toBeInTheDocument();

    // Non-current versions should have navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);

    // Check that the navigation links point to correct entity pages
    const hrefs = links.map(link => link.getAttribute('href'));
    expect(hrefs).toContain(
      '/catalog/default/airesource/code-review-skill-v11',
    );
    expect(hrefs).toContain('/catalog/default/airesource/code-review-skill-v1');
  });

  it('renders recommended badge for recommended sibling', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [currentEntity, middleSibling],
    });

    await renderWithEntity(currentEntity);

    await waitFor(() => {
      expect(screen.getByText('recommended')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching siblings', async () => {
    mockCatalogApi.getEntities.mockReturnValue(new Promise(() => {}));

    await renderWithEntity(currentEntity);

    // Title should render immediately
    expect(screen.getByText('Versions')).toBeInTheDocument();
    // Version badges should not be visible yet (loading skeleton shown)
    expect(screen.queryByText('1.2.0')).toBeNull();
  });

  it('renders navigation link with correct aria-label', async () => {
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [currentEntity, olderSibling],
    });

    await renderWithEntity(currentEntity);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Navigate to version 1.0.0'),
      ).toBeInTheDocument();
    });
  });
});
