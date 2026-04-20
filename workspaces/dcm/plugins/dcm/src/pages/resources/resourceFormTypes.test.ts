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

import {
  emptyResourceForm,
  formToResource,
  isResourceFormValid,
  validateResourceForm,
} from './resourceFormTypes';

describe('validateResourceForm', () => {
  const valid = () => ({
    ...emptyResourceForm(),
    catalog_item_instance_id: 'inst-1',
    spec: '{"cpu":2}',
  });

  it('returns no errors for a valid form', () => {
    expect(validateResourceForm(valid())).toEqual({});
  });

  it('requires catalog_item_instance_id', () => {
    const errors = validateResourceForm({
      ...valid(),
      catalog_item_instance_id: '',
    });
    expect(errors.catalog_item_instance_id).toBeDefined();
  });

  it('requires spec to be valid non-empty JSON', () => {
    expect(validateResourceForm({ ...valid(), spec: '{}' }).spec).toBeDefined();
    expect(
      validateResourceForm({ ...valid(), spec: 'not-json' }).spec,
    ).toBeDefined();
    expect(
      validateResourceForm({ ...valid(), spec: '{"a":1}' }).spec,
    ).toBeUndefined();
  });

  it('validates the optional id pattern', () => {
    expect(
      validateResourceForm({ ...valid(), id: 'Valid-ID' }).id,
    ).toBeDefined();
    expect(
      validateResourceForm({ ...valid(), id: 'valid-id' }).id,
    ).toBeUndefined();
    expect(validateResourceForm({ ...valid(), id: '' }).id).toBeUndefined();
  });
});

describe('isResourceFormValid', () => {
  it('returns true for a valid form', () => {
    expect(
      isResourceFormValid({
        catalog_item_instance_id: 'inst-1',
        spec: '{"key":"value"}',
        id: '',
      }),
    ).toBe(true);
  });
});

describe('formToResource', () => {
  it('parses the spec JSON string into an object', () => {
    const resource = formToResource({
      catalog_item_instance_id: 'inst-1',
      spec: '{"cpu":4,"memory":"8Gi"}',
      id: '',
    });
    expect(resource.spec).toEqual({ cpu: 4, memory: '8Gi' });
    expect(resource.catalog_item_instance_id).toBe('inst-1');
  });
});
