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
import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { MarketplacePackageProcessor } from './MarketplacePackageProcessor';

describe('MarketplacePackageProcessor', () => {
  const testPackage: MarketplacePackage = {
    kind: 'Package',
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    metadata: {
      name: 'backstage-community-plugin-test',
      title: '@backstage-community/plugin-test',
      annotations: {
        'backstage.io/source-location':
          'url https://github.com/redhat-developer/rhdh/tree/main/dynamic-plugins/wrappers/backstage-community-plugin-test',
      },
    },
    spec: {
      packageName: '@backstage-community/plugin-test',
      dynamicArtifact: './dynamic-plugins/dist/backstage-community-plugin-test',
      version: '3.17.0',
      owner: 'test-group',
      partOf: ['plugin-a', 'plugin-b'],
    },
  };

  it('should return processor name', () => {
    const processor = new MarketplacePackageProcessor();
    expect(processor.getProcessorName()).toBe('MarketplacePackageProcessor');
  });

  it('should validate Package kind', async () => {
    const processor = new MarketplacePackageProcessor();
    expect(
      await processor.validateEntityKind({
        ...testPackage,
        kind: 'invalid-kind',
      }),
    ).toBe(false);
    expect(await processor.validateEntityKind(testPackage)).toBe(true);
  });

  it('should return package entity with ownedBy relation', async () => {
    const processor = new MarketplacePackageProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(
      {
        ...testPackage,
        spec: { ...testPackage.spec, partOf: null } as any,
      },
      null as any,
      emit,
    );
    expect(emit).toHaveBeenCalledTimes(1);

    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: {
        source: {
          kind: 'Package',
          namespace: 'default',
          name: 'backstage-community-plugin-test',
        },
        type: 'ownedBy',
        target: { kind: 'Group', namespace: 'default', name: 'test-group' },
      },
    });
  });

  it('should return package entity with partOf relation', async () => {
    const processor = new MarketplacePackageProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(testPackage, null as any, emit);
    expect(emit).toHaveBeenCalledTimes(5);

    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: {
        source: {
          kind: 'Package',
          namespace: 'default',
          name: 'backstage-community-plugin-test',
        },
        type: 'ownedBy',
        target: { kind: 'Group', namespace: 'default', name: 'test-group' },
      },
    });

    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: {
        source: {
          kind: 'Package',
          namespace: 'default',
          name: 'backstage-community-plugin-test',
        },
        type: 'partOf',
        target: { kind: 'Plugin', namespace: 'default', name: 'plugin-a' },
      },
    });
    const getPluginPartOfPackageRelation = (pluginName: string) => ({
      source: {
        kind: 'Package',
        namespace: 'default',
        name: 'backstage-community-plugin-test',
      },
      type: 'partOf',
      target: {
        kind: 'Plugin',
        namespace: 'default',
        name: pluginName,
      },
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: getPluginPartOfPackageRelation('plugin-a'),
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'relation',
      relation: getPluginPartOfPackageRelation('plugin-b'),
    });
  });
});
