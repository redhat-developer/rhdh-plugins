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

import { buildEntityFilterFn } from './buildEntityFilterFn';

const component: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'demo' },
  spec: { type: 'service' },
};

const api: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: { name: 'demo-api' },
  spec: { type: 'openapi' },
};

describe('buildEntityFilterFn', () => {
  it('allows all entities when no filter is configured', () => {
    const filter = buildEntityFilterFn();
    expect(filter(component)).toBe(true);
    expect(filter(api)).toBe(true);
  });

  it('uses a predicate function filter', () => {
    const filter = buildEntityFilterFn(e => e.kind === 'Component');
    expect(filter(component)).toBe(true);
    expect(filter(api)).toBe(false);
  });

  it('evaluates a string filter expression', () => {
    const filter = buildEntityFilterFn(undefined, 'kind:component');
    expect(filter(component)).toBe(true);
    expect(filter(api)).toBe(false);
  });

  it('prefers the predicate when both function and expression are set', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const filter = buildEntityFilterFn(() => false, 'kind:component');
    expect(filter(component)).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate entity filter methods found'),
    );
    warn.mockRestore();
  });
});
