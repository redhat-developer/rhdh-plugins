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
import { errorApiRef } from '@backstage/core-plugin-api';
import {
  type CatalogApi,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('@backstage/plugin-catalog-react', () => {
  const actual = jest.requireActual('@backstage/plugin-catalog-react');

  return {
    ...actual,
    EntityRefLink: ({
      entityRef,
      children,
    }: {
      entityRef: Entity | string;
      children?: ReactNode;
    }) => (
      <a href="/catalog/default/airesource/test">
        {children ??
          (typeof entityRef === 'string'
            ? entityRef
            : (entityRef.metadata.title ?? entityRef.metadata.name))}
      </a>
    ),
  };
});

import { HandoffTargets } from './HandoffTargets';

const target: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'ogx-agent-legal',
    namespace: 'default',
    title: 'Legal',
  },
  spec: { type: 'agent', lifecycle: 'production', owner: 'team-legal' },
};

const mockCatalogApi: Pick<jest.Mocked<CatalogApi>, 'getEntitiesByRefs'> = {
  getEntitiesByRefs: jest.fn(),
};
const mockErrorApi = {
  post: jest.fn(),
  error$: jest.fn(),
};

function renderTargets(refs: string[]) {
  return renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi as unknown as CatalogApi],
        [errorApiRef, mockErrorApi],
      ]}
    >
      <HandoffTargets refs={refs} />
    </TestApiProvider>,
  );
}

describe('HandoffTargets', () => {
  beforeEach(() => {
    mockCatalogApi.getEntitiesByRefs.mockReset();
    mockErrorApi.post.mockReset();
  });

  it('renders resolved targets as links', async () => {
    mockCatalogApi.getEntitiesByRefs.mockResolvedValue({ items: [target] });

    await renderTargets(['airesource:default/ogx-agent-legal']);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Legal' })).toBeInTheDocument();
    });
  });

  it('renders an unresolved target without linking it', async () => {
    const ref = 'airesource:default/missing-agent';
    mockCatalogApi.getEntitiesByRefs.mockResolvedValue({ items: [undefined] });

    await renderTargets([ref]);

    await waitFor(() => {
      expect(screen.getByText(ref)).toBeInTheDocument();
    });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders unresolved targets when lookup fails', async () => {
    const ref = 'airesource:default/unavailable-agent';
    mockCatalogApi.getEntitiesByRefs.mockRejectedValue(new Error('offline'));

    await renderTargets([ref]);

    await waitFor(() => {
      expect(screen.getByText(ref)).toBeInTheDocument();
    });
    expect(mockErrorApi.post).toHaveBeenCalledWith(expect.any(Error));
  });
});
