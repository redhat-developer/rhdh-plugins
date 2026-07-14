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
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { AdoptionCard } from './AdoptionCard';

const skillEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    uid: 'uid-skill',
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
    location: {
      type: 'git',
      target: 'https://github.com/example/code-review-skill',
    },
  },
};

const ociEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'granite-3-code',
    namespace: 'default',
    uid: 'uid-oci',
    annotations: {
      'rhdh.io/ai-asset-source': 'model-registry',
    },
  },
  spec: {
    type: 'ai-model',
    lifecycle: 'production',
    owner: 'team-ml-ops',
    remotes: [
      {
        url: 'oci://registry.example.com/models/granite-3-code:latest',
        type: 'oci',
      },
    ],
  },
};

const gitEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'no-hardcoded-secrets-rule',
    namespace: 'default',
    uid: 'uid-git',
  },
  spec: {
    type: 'rule',
    lifecycle: 'production',
    owner: 'team-security',
    location: {
      type: 'git',
      target: 'https://github.com/example/no-hardcoded-secrets-rule',
    },
  },
};

const mcpEntity: Entity = {
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
    remotes: [
      { url: 'https://mcp.example.com/github', type: 'streamable-http' },
    ],
  },
};

const noActionEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: {
    name: 'web-search-tool',
    namespace: 'default',
    uid: 'uid-no-action',
  },
  spec: {
    type: 'ai-tool',
    lifecycle: 'experimental',
    owner: 'team-integrations',
  },
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <AdoptionCard />
    </EntityProvider>,
  );
}

describe('AdoptionCard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders npx command for skill entities', async () => {
    await renderWithEntity(skillEntity);

    expect(
      screen.getByText('npx skills add code-review-skill'),
    ).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('renders podman pull command for OCI-sourced entities', async () => {
    await renderWithEntity(ociEntity);

    expect(
      screen.getByText(
        'podman pull oci://registry.example.com/models/granite-3-code:latest',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('renders Download ZIP button for git-sourced entities', async () => {
    await renderWithEntity(gitEntity);

    expect(screen.getByText('Download ZIP')).toBeInTheDocument();
  });

  it('renders remote URL for MCP server entities', async () => {
    await renderWithEntity(mcpEntity);

    expect(
      screen.getByText('https://mcp.example.com/github'),
    ).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('renders nothing for entities with no actionable metadata', async () => {
    const { container } = await renderWithEntity(noActionEntity);

    expect(container.querySelector('.command')).toBeNull();
    expect(screen.queryByText('Copy')).toBeNull();
    expect(screen.queryByText('Download ZIP')).toBeNull();
  });

  it('copies command to clipboard when copy button is clicked', async () => {
    await renderWithEntity(skillEntity);

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'npx skills add code-review-skill',
    );

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });
});
