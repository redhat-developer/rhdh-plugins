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
import { ExtensionsPackage } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { ExtensionsPackageProcessor } from './ExtensionsPackageProcessor';

const testPackage: ExtensionsPackage = {
  kind: 'Package',
  apiVersion: 'extensions.backstage.io/v1alpha1',
  metadata: {
    name: 'test-package',
    title: '@backstage-community/plugin-test',
  },
  spec: {
    packageName: '@backstage-community/plugin-test',
    dynamicArtifact: './dynamic-plugins/dist/backstage-community-plugin-test',
    version: '3.17.0',
    owner: 'test-group',
    partOf: ['plugin-a', 'plugin-b'],
  },
};

const getRelation = (
  type: string,
  sourceKind: string,
  sourceName: string,
  targetKind: string,
  targetName: string,
) => ({
  type: 'relation',
  relation: {
    type,
    source: {
      kind: sourceKind,
      namespace: 'default',
      name: sourceName,
    },
    target: {
      kind: targetKind,
      namespace: 'default',
      name: targetName,
    },
  },
});

describe('ExtensionsPackageProcessor', () => {
  it('should return processor name', () => {
    const processor = new ExtensionsPackageProcessor();
    expect(processor.getProcessorName()).toBe('ExtensionsPackageProcessor');
  });

  it('should validate Package kind', async () => {
    const processor = new ExtensionsPackageProcessor();
    expect(
      await processor.validateEntityKind({
        ...testPackage,
        kind: 'invalid-kind',
      }),
    ).toBe(false);
    expect(await processor.validateEntityKind(testPackage)).toBe(true);
  });

  it('should return package entity with ownedBy relation', async () => {
    const processor = new ExtensionsPackageProcessor();

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
    expect(emit).toHaveBeenCalledWith(
      getRelation('ownedBy', 'Package', 'test-package', 'Group', 'test-group'),
    );
  });

  it('should return package entity with partOf relation', async () => {
    const processor = new ExtensionsPackageProcessor();

    const emit = jest.fn();
    await processor.postProcessEntity(
      {
        ...testPackage,
        spec: { ...testPackage.spec, owner: undefined } as any,
      },
      null as any,
      emit,
    );

    expect(emit).toHaveBeenCalledTimes(4);
    expect(emit).toHaveBeenCalledWith(
      getRelation('partOf', 'Package', 'test-package', 'Plugin', 'plugin-a'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('hasPart', 'Plugin', 'plugin-a', 'Package', 'test-package'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('partOf', 'Package', 'test-package', 'Plugin', 'plugin-b'),
    );
    expect(emit).toHaveBeenCalledWith(
      getRelation('hasPart', 'Plugin', 'plugin-b', 'Package', 'test-package'),
    );
  });
});
