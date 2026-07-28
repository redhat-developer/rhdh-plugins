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

import { type Entity } from '@backstage/catalog-model';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';

import { SummaryCard } from './SummaryCard';

const fullEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    uid: 'uid-full',
    description: 'Automates code reviews using AI',
    annotations: {
      'rhdh.io/ai-asset-version': '1.2.0',
      'rhdh.io/ai-asset-source': 'github',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
    rationale: 'Reduce review turnaround time',
  },
};

const modelEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'granite-3-code',
    namespace: 'default',
    uid: 'uid-model',
    description: 'Code generation model',
    annotations: {
      'rhdh.io/ai-asset-version': '3.0.1',
      'rhdh.io/ai-asset-source': 'model-registry',
    },
  },
  spec: {
    type: 'ai-model',
    lifecycle: 'production',
    owner: 'team-ml-ops',
  },
};

const minimalEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'github-mcp-server',
    namespace: 'default',
    uid: 'uid-mcp',
  },
  spec: {
    type: 'mcp-server',
    lifecycle: 'experimental',
    owner: 'team-integrations',
  },
};

const toolEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'web-search-tool',
    namespace: 'default',
    uid: 'uid-tool',
  },
  spec: {
    type: 'ai-tool',
    owner: 'team-integrations',
  },
};

const emptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'empty-asset',
    namespace: 'default',
    uid: 'uid-empty',
  },
  spec: {},
};

const descriptionOnlyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'described-asset',
    namespace: 'default',
    uid: 'uid-desc',
    description: 'Has only a description',
  },
  spec: {},
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <SummaryCard />
    </EntityProvider>,
  );
}

describe('SummaryCard', () => {
  it('renders category badge, version, source, lifecycle, and description for a fully populated entity', async () => {
    await renderWithEntity(fullEntity);

    // Category badge
    expect(screen.getByText('Skills')).toBeInTheDocument();
    // Version
    expect(screen.getByText('1.2.0')).toBeInTheDocument();
    // Source
    expect(screen.getByText(/github/)).toBeInTheDocument();
    // Lifecycle
    expect(screen.getByText('production')).toBeInTheDocument();
    // Description
    expect(
      screen.getByText('Automates code reviews using AI'),
    ).toBeInTheDocument();
    // Rationale
    expect(
      screen.getByText('Reduce review turnaround time'),
    ).toBeInTheDocument();
  });

  it('renders category badge and lifecycle, omits version and source when absent', async () => {
    await renderWithEntity(minimalEntity);

    // Category badge for mcp-server
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
    // Lifecycle
    expect(screen.getByText('experimental')).toBeInTheDocument();
    // No version or source
    expect(screen.queryByText('1.2.0')).toBeNull();
    expect(screen.queryByText(/Source/)).toBeNull();
  });

  it('renders category badge with label and color from getCategoryMeta', async () => {
    await renderWithEntity(modelEntity);

    const badge = screen.getByText('Models');
    expect(badge).toBeInTheDocument();

    // The badge parent should have the category color style
    const badgeEl = badge.closest('[style]');
    expect(badgeEl).toBeTruthy();
    expect(badgeEl?.getAttribute('style')).toContain('var(--boost-color-model');
  });

  it('renders green lifecycle badge for production and amber for experimental', async () => {
    const { unmount } = await renderWithEntity(fullEntity);
    const productionBadge = screen.getByLabelText(/Lifecycle: production/);
    const prodStyle = productionBadge.getAttribute('style') ?? '';
    // Browser may render hex as rgb()
    expect(
      prodStyle.includes('#4ade80') || prodStyle.includes('rgb(74, 222, 128)'),
    ).toBe(true);
    unmount();

    await renderWithEntity(minimalEntity);
    const experimentalBadge = screen.getByLabelText(/Lifecycle: experimental/);
    const expStyle = experimentalBadge.getAttribute('style') ?? '';
    expect(
      expStyle.includes('#fbbf24') || expStyle.includes('rgb(251, 191, 36)'),
    ).toBe(true);
  });

  it('returns null when description, rationale, and all metadata fields are absent', async () => {
    const { container } = await renderWithEntity(emptyEntity);

    expect(container.innerHTML).toBe('');
  });

  it('preserves description and rationale rendering', async () => {
    await renderWithEntity(fullEntity);

    expect(
      screen.getByText('Automates code reviews using AI'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reduce review turnaround time'),
    ).toBeInTheDocument();
  });

  it('renders when only description is present (no spec metadata)', async () => {
    await renderWithEntity(descriptionOnlyEntity);

    expect(screen.getByText('Has only a description')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders category badge without version or lifecycle when only type is present', async () => {
    await renderWithEntity(toolEntity);

    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.queryByText('production')).toBeNull();
    expect(screen.queryByText('experimental')).toBeNull();
  });
});
