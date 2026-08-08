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
import { resolveCodecovEntityInfo } from './CodecovConfig';

function createEntity(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      namespace: 'default',
      annotations,
    },
    spec: {
      type: 'service',
      owner: 'test',
      lifecycle: 'production',
    },
  };
}

describe('resolveCodecovEntityInfo', () => {
  it('parses owner/repo from codecov.io/repo annotation', () => {
    const entity = createEntity({
      'codecov.io/repo': 'redhat-developer/rhdh-plugins',
      'github.com/project-slug': 'redhat-developer/rhdh-plugins',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result).toEqual({
      service: 'github',
      owner: 'redhat-developer',
      repo: 'rhdh-plugins',
      accountName: undefined,
    });
  });

  it('uses codecov.io/service annotation when present', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myorg/myrepo',
      'codecov.io/service': 'gitlab',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result).toEqual({
      service: 'gitlab',
      owner: 'myorg',
      repo: 'myrepo',
      accountName: undefined,
    });
  });

  it('falls back to github service when github.com/project-slug is present', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myorg/myrepo',
      'github.com/project-slug': 'myorg/myrepo',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result.service).toBe('github');
  });

  it('throws when service cannot be determined', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myorg/myrepo',
    });

    expect(() => resolveCodecovEntityInfo(entity)).toThrow(
      /Cannot determine Codecov service/,
    );
  });

  it('uses codecov.io/owner annotation when present', () => {
    const entity = createEntity({
      'codecov.io/repo': 'different-org/myrepo',
      'codecov.io/owner': 'custom-owner',
      'github.com/project-slug': 'whatever/whatever',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result.owner).toBe('custom-owner');
    expect(result.repo).toBe('myrepo');
  });

  it('uses repo annotation directly when no slash and owner annotation is set', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myrepo',
      'codecov.io/owner': 'myowner',
      'github.com/project-slug': 'whatever/whatever',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result.owner).toBe('myowner');
    expect(result.repo).toBe('myrepo');
  });

  it('throws when owner cannot be determined (no slash, no owner annotation)', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myrepo',
      'github.com/project-slug': 'whatever/whatever',
    });

    expect(() => resolveCodecovEntityInfo(entity)).toThrow(
      /Cannot determine Codecov owner/,
    );
  });

  it('throws when codecov.io/repo annotation is missing', () => {
    const entity = createEntity({
      'github.com/project-slug': 'whatever/whatever',
    });

    expect(() => resolveCodecovEntityInfo(entity)).toThrow(
      /Missing annotation 'codecov.io\/repo'/,
    );
  });

  it('includes account name from annotation', () => {
    const entity = createEntity({
      'codecov.io/repo': 'myorg/myrepo',
      'codecov.io/account': 'enterprise',
      'github.com/project-slug': 'myorg/myrepo',
    });

    const result = resolveCodecovEntityInfo(entity);

    expect(result.accountName).toBe('enterprise');
  });
});
