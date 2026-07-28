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

import { Entity } from '@backstage/catalog-model';
import { renderInTestApp } from '@backstage/test-utils';

import { AiAssetCard } from './AiAssetCard';

const mockSkillEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    title: 'Code Review Skill',
    description: 'Automated code review for common issues.',
    namespace: 'default',
    uid: 'uid-1',
    tags: ['security', 'quality'],
    annotations: {
      'rhdh.io/ai-asset-source': 'github',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ai-platform',
  },
};

const mockAgentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'developer-assistant',
    namespace: 'default',
    uid: 'uid-2',
    tags: [],
  },
  spec: {
    type: 'ai-agent',
    lifecycle: 'experimental',
    owner: 'team-ai',
  },
};

describe('AiAssetCard', () => {
  it('renders entity title and description', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    expect(rendered.getByText('Code Review Skill')).toBeInTheDocument();
    expect(
      rendered.getByText('Automated code review for common issues.'),
    ).toBeInTheDocument();
  });

  it('renders category badge', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    expect(rendered.getByText('Skills')).toBeInTheDocument();
  });

  it('renders tags', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    expect(rendered.getByText('security')).toBeInTheDocument();
    expect(rendered.getByText('quality')).toBeInTheDocument();
  });

  it('renders owner', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    expect(rendered.getByText('team-ai-platform')).toBeInTheDocument();
  });

  it('renders scope from annotation', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    expect(rendered.getByText('github')).toBeInTheDocument();
  });

  it('links to catalog entity detail page', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockSkillEntity} />,
    );
    const link = rendered.getByRole('link', {
      name: /view code review skill details/i,
    });
    expect(link).toHaveAttribute(
      'href',
      '/catalog/default/airesource/code-review-skill',
    );
  });

  it('falls back to metadata.name when title is absent', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockAgentEntity} />,
    );
    expect(rendered.getByText('developer-assistant')).toBeInTheDocument();
  });

  it('renders Agents category for ai-agent type', async () => {
    const rendered = await renderInTestApp(
      <AiAssetCard entity={mockAgentEntity} />,
    );
    expect(rendered.getByText('Agents')).toBeInTheDocument();
  });
});
