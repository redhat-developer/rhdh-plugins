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
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent, screen } from '@testing-library/react';

import { boostMessages } from '../../../translations/ref';
import { AssetDetailsCard } from './AssetDetailsCard';

jest.mock('@backstage/plugin-catalog-react', () => {
  const actual = jest.requireActual('@backstage/plugin-catalog-react');

  return {
    ...actual,
    EntityRefLinks: ({ entityRefs }: { entityRefs: string[] }) => (
      <>
        {entityRefs.map(entityRef => (
          <a href={`/catalog/default/airesource/${entityRef}`} key={entityRef}>
            {entityRef}
          </a>
        ))}
      </>
    ),
  };
});

const { catalog: msg } = boostMessages;

const skillEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    description: 'Reviews pull requests for common issues.',
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai',
    rationale: 'Catch defects early.',
    disciplines: ['software-engineering'],
    categories: ['code-quality'],
    agents: ['airesource:default/developer-assistant'],
  },
};

const emptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'empty-skill', namespace: 'default' },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

const skillWithAgentFields: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    description: 'Reviews pull requests for common issues.',
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai',
    handoffDescription: 'Routes coding questions',
    enableRAG: true,
  },
};

const agentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'dev-assistant',
    namespace: 'default',
    description: 'Helps developers.',
  },
  spec: {
    type: 'agent',
    lifecycle: 'production',
    owner: 'team-ai',
    model: 'openai/vllm-inference/gpt-4.1',
    tools: ['resource:default/web-search-tool'],
    instructions: 'Be concise.',
    handoffDescription: 'Routes coding questions',
    enableRAG: true,
    models: { available: ['granite-8b'] },
  },
};

const mcpEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'github-mcp-server',
    namespace: 'default',
    description: 'GitHub context server.',
  },
  spec: {
    type: 'mcp-server',
    lifecycle: 'experimental',
    owner: 'team-integrations',
    definition: 'openapi: 3.0.0\ninfo:\n  title: GitHub MCP Server',
    remotes: [
      { type: 'streamable-http', url: 'https://mcp.example.com/github' },
    ],
  },
};

const ruleEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'no-hardcoded-secrets-rule',
    namespace: 'default',
    annotations: { 'rhdh.io/ai-asset-version': '2.0.1' },
  },
  spec: {
    type: 'rule',
    lifecycle: 'production',
    owner: 'team-security',
    category: 'security',
  },
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <AssetDetailsCard />
    </EntityProvider>,
  );
}

describe('AssetDetailsCard', () => {
  it('renders distinct rationale without repeating the catalog description', async () => {
    await renderWithEntity(skillEntity);
    expect(screen.getByText(msg.card.assetDetailsTitle)).toBeInTheDocument();
    expect(screen.getByText('Catch defects early.')).toBeInTheDocument();
    expect(
      screen.queryByText('Reviews pull requests for common issues.'),
    ).toBeNull();
  });

  it('renders skill metadata with built-in tags and entity links', async () => {
    await renderWithEntity(skillEntity);

    expect(screen.getByText('software-engineering')).toBeInTheDocument();
    expect(screen.getByText('code-quality')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'airesource:default/developer-assistant',
      }),
    ).toBeInTheDocument();
  });

  it('renders MCP remotes and a collapsible definition', async () => {
    await renderWithEntity(mcpEntity);

    expect(
      screen.getByRole('link', {
        name: 'streamable-http: https://mcp.example.com/github',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: msg.card.viewDefinition }),
    ).toBeInTheDocument();
  });

  it('does not turn non-http MCP remotes into links', async () => {
    const unsafeRemote = ['java', 'script:alert(1)'].join('');

    await renderWithEntity({
      ...mcpEntity,
      spec: {
        ...mcpEntity.spec,
        remotes: [{ type: 'custom', url: unsafeRemote }],
      },
    });

    expect(
      screen.queryByRole('link', {
        name: `custom: ${unsafeRemote}`,
      }),
    ).toBeNull();
    expect(screen.getByText(`custom: ${unsafeRemote}`)).toBeInTheDocument();
  });

  it('renders rule metadata', async () => {
    await renderWithEntity(ruleEntity);

    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('2.0.1')).toBeInTheDocument();
  });

  it('renders nothing when there is no asset detail content', async () => {
    const { container } = await renderWithEntity(emptyEntity);
    expect(container).toBeEmptyDOMElement();
  });

  it('hides agent-only fields on a skill even when those spec keys are set', async () => {
    await renderWithEntity(skillWithAgentFields);
    expect(screen.queryByText(msg.card.handoffDescriptionTitle)).toBeNull();
    expect(screen.queryByText(msg.card.ragEnabledLabel)).toBeNull();
  });

  it('does not repeat an agent description as detail content', async () => {
    await renderWithEntity({
      ...agentEntity,
      metadata: { ...agentEntity.metadata, description: 'Be concise.' },
      spec: {
        ...agentEntity.spec,
        instructions: 'Be concise.',
        handoffDescription: 'Be concise.',
        model: undefined,
        models: undefined,
        tools: undefined,
        enableRAG: undefined,
      },
    });

    expect(screen.queryByText(msg.card.assetDetailsTitle)).toBeNull();
  });

  it('renders agent-only fields and available models', async () => {
    await renderWithEntity(agentEntity);
    expect(
      screen.getByText(`1 ${msg.card.modelsAvailableSuffix}`),
    ).toBeInTheDocument();
    expect(screen.getByText(msg.card.modelTitle)).toBeInTheDocument();
    expect(
      screen.getByText('resource:default/web-search-tool'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('openai/vllm-inference/gpt-4.1'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: msg.card.viewModels }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('granite-8b')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByText(msg.card.handoffDescriptionTitle),
    ).toBeInTheDocument();
    expect(screen.getByText('Routes coding questions')).toBeInTheDocument();
    expect(screen.getByText(msg.card.ragEnabledLabel)).toBeInTheDocument();
    expect(screen.getByText(msg.card.yes)).toBeInTheDocument();
  });

  it('renders the translated disabled RAG status', async () => {
    await renderWithEntity({
      ...agentEntity,
      spec: { ...agentEntity.spec, enableRAG: false },
    });

    expect(screen.getByText(msg.card.no)).toBeInTheDocument();
  });

  it('renders handoff descriptions as normal text', async () => {
    await renderWithEntity({
      ...agentEntity,
      spec: {
        ...agentEntity.spec,
        handoffDescription: 'Route **handoff** via `specialist`.',
      },
    });

    const description = screen.getByText('Route **handoff** via `specialist`.');
    expect(description).toBeInTheDocument();
    expect(description.querySelector('strong')).toBeNull();
    expect(description.querySelector('code')).toBeNull();
  });
});
