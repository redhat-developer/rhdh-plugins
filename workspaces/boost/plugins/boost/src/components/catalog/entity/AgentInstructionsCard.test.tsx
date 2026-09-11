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
import { screen } from '@testing-library/react';

import { boostMessages } from '../../../translations/ref';
import { AgentInstructionsCard } from './AgentInstructionsCard';

const instructions = 'Use **concise** answers and `short` examples.';

const agent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'developer-assistant',
    namespace: 'default',
    description: 'An assistant for developers.',
  },
  spec: {
    type: 'agent',
    lifecycle: 'production',
    owner: 'team-ai',
    instructions,
  },
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <AgentInstructionsCard />
    </EntityProvider>,
  );
}

describe('AgentInstructionsCard', () => {
  it('renders agent instructions as Markdown in its own card', async () => {
    await renderWithEntity(agent);

    expect(
      screen.getByText(boostMessages.catalog.card.instructionsTitle),
    ).toBeInTheDocument();
    expect(screen.getByText('concise').tagName).toBe('STRONG');
    expect(screen.getByText('short').tagName).toBe('CODE');
  });

  it('does not repeat the entity description as instructions', async () => {
    const { container } = await renderWithEntity({
      ...agent,
      metadata: {
        ...agent.metadata,
        description: instructions,
      },
    });

    expect(container).toBeEmptyDOMElement();
  });
});
