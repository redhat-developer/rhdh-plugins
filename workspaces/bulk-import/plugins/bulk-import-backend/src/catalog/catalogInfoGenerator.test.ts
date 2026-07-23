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

import { mockServices } from '@backstage/backend-test-utils';
import type { AnalyzeLocationResponse } from '@backstage/plugin-catalog-common';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

import { CatalogHttpClient } from './catalogHttpClient';
import { CatalogInfoGenerator } from './catalogInfoGenerator';

describe('catalogInfoGenerator', () => {
  let catalogInfoGenerator: CatalogInfoGenerator;
  let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;

  beforeEach(() => {
    mockCatalog = catalogServiceMock.mock({
      analyzeLocation: jest.fn().mockResolvedValue({
        existingEntityFiles: [],
        generateEntities: [],
      }),
    });
    const mockAuth = mockServices.auth();
    const logger = mockServices.logger.mock();
    catalogInfoGenerator = new CatalogInfoGenerator(
      logger,
      new CatalogHttpClient({
        logger,
        config: mockServices.rootConfig({ data: {} }),
        auth: mockAuth,
        catalog: mockCatalog,
      }),
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fail to return a default catalog-info yaml string if a wrong repo URL is set', async () => {
    await expect(
      catalogInfoGenerator.generateDefaultCatalogInfoContent('xxxyyy'),
    ).rejects.toThrow('URL parsing failed');
  });

  it('should return a default catalog-info yaml string if analysis is not set', async () => {
    const repoUrl = 'https://ghe.example.com/my-org/my-repo';
    await expect(
      catalogInfoGenerator.generateDefaultCatalogInfoContent(repoUrl, false),
    ).resolves.toBe(getDefaultCatalogInfo('my-org', 'my-repo'));
  });

  it('should return a default catalog-info yaml string if analyze-location endpoint is not available', async () => {
    mockCatalog.analyzeLocation.mockRejectedValue(new Error('unavailable'));
    const repoUrl = 'https://github.com/my-org-2/my-repo-2';
    await expect(
      catalogInfoGenerator.generateDefaultCatalogInfoContent(repoUrl),
    ).resolves.toBe(getDefaultCatalogInfo('my-org-2', 'my-repo-2'));
  });

  it('should return a default catalog-info yaml string if analyze-location endpoint returns nothing', async () => {
    const repoUrl = 'https://github.com/my-org-3/my-repo-3';
    await expect(
      catalogInfoGenerator.generateDefaultCatalogInfoContent(repoUrl),
    ).resolves.toBe(getDefaultCatalogInfo('my-org-3', 'my-repo-3'));
    expect(mockCatalog.analyzeLocation).toHaveBeenCalledWith(
      {
        location: {
          type: 'github',
          target: repoUrl,
        },
      },
      {
        credentials: expect.any(Object),
      },
    );
  });

  it('should return catalog-info yaml string if analyze-location endpoint returns some data', async () => {
    mockCatalog.analyzeLocation.mockResolvedValue(
      mockAnalyzeLocationResponse('my-org-4', [
        'my-repo-comp-41',
        'my-repo-comp-42',
      ]),
    );

    const repoUrl = 'https://github.com/my-org-4/my-repo-4';
    await expect(
      catalogInfoGenerator.generateDefaultCatalogInfoContent(repoUrl),
    ).resolves.toBe(`---
${getDefaultCatalogInfoWithoutSeparators('my-org-4', 'my-repo-comp-41')}

---
${getDefaultCatalogInfoWithoutSeparators('my-org-4', 'my-repo-comp-42')}
`);
    expect(mockCatalog.analyzeLocation).toHaveBeenCalledWith(
      {
        location: {
          type: 'github',
          target: repoUrl,
        },
      },
      {
        credentials: expect.any(Object),
      },
    );
  });
});

function getDefaultCatalogInfo(org: string, name: string): string {
  return `---
${getDefaultCatalogInfoWithoutSeparators(org, name)}
---`;
}

function getDefaultCatalogInfoWithoutSeparators(
  org: string,
  name: string,
): string {
  return `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${name}
  annotations:
    github.com/project-slug: ${org}/${name}
spec:
  type: other
  lifecycle: unknown
  owner: ${org}`;
}

function mockAnalyzeLocationResponse(
  org: string,
  componentsToReturn: string[],
): AnalyzeLocationResponse {
  return {
    existingEntityFiles: [],
    generateEntities: componentsToReturn.map(comp => ({
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: comp,
          annotations: {
            'github.com/project-slug': `${org}/${comp}`,
          },
        },
        spec: {
          type: 'other',
          lifecycle: 'unknown',
          owner: org,
        },
      },
      fields: [],
    })),
  };
}
