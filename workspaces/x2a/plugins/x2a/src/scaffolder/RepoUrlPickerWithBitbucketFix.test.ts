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

import type { ScmIntegration } from '@backstage/integration';
import { wrapIntegrationsApi } from './RepoUrlPickerWithBitbucketFix';

function createFakeApi(integrationsByHost: Record<string, ScmIntegration>) {
  return {
    list: jest.fn(() => Object.values(integrationsByHost)),
    byUrl: jest.fn(),
    byHost: jest.fn((host: string) => integrationsByHost[host]),
    resolveUrl: jest.fn(),
    resolveEditUrl: jest.fn(),
  } as any;
}

function makeIntegration(type: string, host: string): ScmIntegration {
  return {
    type,
    title: `${type} - ${host}`,
    byUrl: jest.fn(),
    resolveUrl: jest.fn(),
    resolveEditUrl: jest.fn(),
  } as unknown as ScmIntegration;
}

describe('wrapIntegrationsApi', () => {
  it('remaps bitbucketCloud type to bitbucket', () => {
    const integration = makeIntegration('bitbucketCloud', 'bitbucket.org');
    const api = createFakeApi({ 'bitbucket.org': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('bitbucket.org');

    expect(result).toBeDefined();
    expect(result!.type).toBe('bitbucket');
  });

  it('remaps bitbucketServer type to bitbucket', () => {
    const integration = makeIntegration(
      'bitbucketServer',
      'bitbucket.mycompany.com',
    );
    const api = createFakeApi({ 'bitbucket.mycompany.com': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('bitbucket.mycompany.com');

    expect(result).toBeDefined();
    expect(result!.type).toBe('bitbucket');
  });

  it('preserves non-type properties on remapped integrations', () => {
    const integration = makeIntegration('bitbucketCloud', 'bitbucket.org');
    const api = createFakeApi({ 'bitbucket.org': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('bitbucket.org')!;

    expect(result.title).toBe('bitbucketCloud - bitbucket.org');
    expect(result.resolveUrl).toBe(integration.resolveUrl);
    expect(result.resolveEditUrl).toBe(integration.resolveEditUrl);
  });

  it('does not remap github integrations', () => {
    const integration = makeIntegration('github', 'github.com');
    const api = createFakeApi({ 'github.com': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('github.com');

    expect(result).toBeDefined();
    expect(result!.type).toBe('github');
  });

  it('does not remap gitlab integrations', () => {
    const integration = makeIntegration('gitlab', 'gitlab.com');
    const api = createFakeApi({ 'gitlab.com': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('gitlab.com');

    expect(result!.type).toBe('gitlab');
  });

  it('returns undefined for unknown hosts', () => {
    const api = createFakeApi({});
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.byHost('unknown.example.com');

    expect(result).toBeUndefined();
  });

  it('delegates non-byHost properties to the original api', () => {
    const integration = makeIntegration('github', 'github.com');
    const api = createFakeApi({ 'github.com': integration });
    const wrapped = wrapIntegrationsApi(api);

    const result = wrapped.list();

    expect(api.list).toHaveBeenCalled();
    expect(result).toEqual([integration]);
  });
});
