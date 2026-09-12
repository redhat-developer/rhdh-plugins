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
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import {
  permissionApiRef,
  type PermissionApi,
} from '@backstage/plugin-permission-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { fireEvent, screen } from '@testing-library/react';

import { boostMessages } from '../../../translations/ref';
import { UsageCard } from './UsageCard';

const { catalog: msg } = boostMessages;
const writeText = jest.fn();
const permissionApi: jest.Mocked<PermissionApi> = {
  authorize: jest.fn(),
};

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
    name: 'custom-ai-tool',
    namespace: 'default',
    uid: 'uid-oci',
    annotations: {
      'rhdh.io/ai-asset-source': 'registry',
    },
  },
  spec: {
    type: 'ai-tool',
    lifecycle: 'production',
    owner: 'team-integrations',
    remotes: [
      {
        url: 'oci://registry.example.com/tools/custom-ai-tool:latest',
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

const gitSubpathEntity: Entity = {
  ...gitEntity,
  metadata: {
    ...gitEntity.metadata,
    name: 'git-subpath-rule',
    uid: 'uid-git-subpath',
  },
  spec: {
    ...gitEntity.spec,
    location: {
      type: 'git',
      target: 'https://github.com/example/repo/tree/main/rules',
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

const modelServerEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiModelServerAPI',
  metadata: {
    name: 'granite-model-server',
    namespace: 'default',
    uid: 'uid-model-server',
  },
  spec: {
    type: 'ai-model-server',
    lifecycle: 'production',
    owner: 'team-ml-ops',
    serverUrl: 'https://granite.example.com/v1',
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

function renderWithEntity(entity: Entity, allowed = true) {
  permissionApi.authorize.mockResolvedValue({
    result: allowed ? AuthorizeResult.ALLOW : AuthorizeResult.DENY,
  });

  return renderInTestApp(
    <TestApiProvider apis={[[permissionApiRef, permissionApi]]}>
      <EntityProvider entity={entity}>
        <UsageCard />
      </EntityProvider>
    </TestApiProvider>,
  );
}

describe('UsageCard', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    permissionApi.authorize.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('renders npx command for skill entities', async () => {
    await renderWithEntity(skillEntity);

    expect(
      screen.getByText('npx skills add code-review-skill'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: msg.card.copyCommand }),
    ).toBeInTheDocument();
  });

  it('does not render usage actions without permission', async () => {
    const deniedEntity = {
      ...skillEntity,
      metadata: {
        ...skillEntity.metadata,
        name: 'denied-skill',
        uid: 'uid-denied',
      },
    };
    await renderWithEntity(deniedEntity, false);

    expect(screen.queryByText('npx skills add code-review-skill')).toBeNull();
    expect(
      screen.queryByRole('button', { name: msg.card.copyCommand }),
    ).toBeNull();
  });

  it('shows copied feedback after copying a command', async () => {
    await renderWithEntity(skillEntity);

    fireEvent.click(screen.getByRole('button', { name: msg.card.copyCommand }));

    expect(
      await screen.findByRole('button', { name: msg.card.copied }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('npx skills add code-review-skill');
  });

  it('shows an error when copying a command fails', async () => {
    writeText.mockRejectedValueOnce(new Error('clipboard unavailable'));
    await renderWithEntity(skillEntity);

    fireEvent.click(screen.getByRole('button', { name: msg.card.copyCommand }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      msg.card.copyFailed,
    );
  });

  it('renders podman pull command for OCI-sourced entities', async () => {
    await renderWithEntity(ociEntity);

    expect(
      screen.getByText(
        'podman pull oci://registry.example.com/tools/custom-ai-tool:latest',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: msg.card.copyCommand }),
    ).toBeInTheDocument();
  });

  it('renders Download ZIP button for git-sourced entities', async () => {
    await renderWithEntity(gitEntity);

    expect(screen.getByText('Download ZIP')).toBeInTheDocument();
  });

  it('renders a source link for git subpaths', async () => {
    await renderWithEntity(gitSubpathEntity);

    expect(screen.getByText('View source')).toBeInTheDocument();
    expect(screen.queryByText('Download ZIP')).toBeNull();
  });

  it('renders remote URL for MCP server entities', async () => {
    await renderWithEntity(mcpEntity);

    expect(
      screen.getByText('https://mcp.example.com/github'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: msg.card.copyCommand }),
    ).toBeInTheDocument();
  });

  it('renders the model server endpoint as usage information', async () => {
    await renderWithEntity(modelServerEntity);

    expect(
      screen.getByText('https://granite.example.com/v1'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: msg.card.copyCommand }),
    ).toBeInTheDocument();
  });

  it('renders nothing for entities with no actionable metadata', async () => {
    const { container } = await renderWithEntity(noActionEntity);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Download ZIP')).toBeNull();
  });

  it('opens the git archive URL with noopener,noreferrer when Download ZIP is clicked', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    await renderWithEntity(gitEntity);
    fireEvent.click(screen.getByText('Download ZIP'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://api.github.com/repos/example/no-hardcoded-secrets-rule/zipball',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });

  it('opens the original source URL for a Git subpath', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    await renderWithEntity(gitSubpathEntity);
    fireEvent.click(screen.getByText('View source'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/example/repo/tree/main/rules',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });
});
