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
import { VersionListCard } from './VersionListCard';

const { catalog: msg } = boostMessages;

const versioned: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'default',
    annotations: { 'rhdh.io/ai-asset-version': '1.4.0' },
  },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

const unversioned: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'code-review-skill', namespace: 'default' },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai' },
};

function renderWithEntity(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <VersionListCard />
    </EntityProvider>,
  );
}

describe('VersionListCard', () => {
  it('renders the current version badge', async () => {
    await renderWithEntity(versioned);
    expect(screen.getByText(msg.card.versionTitle)).toBeInTheDocument();
    expect(screen.getByText('1.4.0')).toBeInTheDocument();
    expect(screen.getByText(msg.card.versionCurrent)).toBeInTheDocument();
  });

  it('renders nothing when the version annotation is missing', async () => {
    await renderWithEntity(unversioned);
    expect(screen.queryByText(msg.card.versionTitle)).toBeNull();
  });
});
