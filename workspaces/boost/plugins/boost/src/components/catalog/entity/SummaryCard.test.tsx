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

import { boostMessages } from '../../../translations/ref';
import { SummaryCard } from './SummaryCard';

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
  },
};

const emptyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'empty-skill', namespace: 'default' },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
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
    instructions: 'Be concise.',
    handoffDescription: 'Routes coding questions',
    enableRAG: true,
    models: { available: ['granite-8b'] },
  },
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <SummaryCard />
    </EntityProvider>,
  );
}

describe('SummaryCard', () => {
  it('renders description and rationale', async () => {
    await renderWithEntity(skillEntity);
    expect(screen.getByText(msg.card.summaryTitle)).toBeInTheDocument();
    expect(
      screen.getByText('Reviews pull requests for common issues.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Catch defects early.')).toBeInTheDocument();
  });

  it('renders nothing when there is no summary content', async () => {
    const { container } = await renderWithEntity(emptyEntity);
    expect(screen.queryByText(msg.card.summaryTitle)).toBeNull();
    expect(container.querySelector('[class*="card"]')).toBeNull();
  });

  it('renders agent-only fields and available models', async () => {
    await renderWithEntity(agentEntity);
    expect(
      screen.getByText(`${msg.card.modelsAvailableTitle} (1)`),
    ).toBeInTheDocument();
    expect(screen.getByText('granite-8b')).toBeInTheDocument();
    expect(screen.getByText(msg.card.instructionsTitle)).toBeInTheDocument();
    expect(screen.getByText('Be concise.')).toBeInTheDocument();
    expect(
      screen.getByText(msg.card.handoffDescriptionTitle),
    ).toBeInTheDocument();
    expect(screen.getByText('Routes coding questions')).toBeInTheDocument();
    expect(screen.getByText(msg.card.ragEnabledLabel)).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });
});
