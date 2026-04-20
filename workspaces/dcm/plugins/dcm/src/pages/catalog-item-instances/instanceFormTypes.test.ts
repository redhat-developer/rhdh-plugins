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
  validateInstanceForm,
  isInstanceFormValid,
  emptyInstanceForm,
  buildUserValueRows,
  formToInstance,
} from './instanceFormTypes';
import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validForm() {
  return {
    ...emptyInstanceForm(),
    display_name: 'My Instance',
    catalog_item_id: 'catalog-item-1',
    api_version: 'v1alpha1',
  };
}

// ---------------------------------------------------------------------------
// api_version validation
// ---------------------------------------------------------------------------

describe('api_version validation', () => {
  const validVersions = [
    'v1',
    'v2',
    'v100',
    'v1alpha',
    'v1alpha1',
    'v2beta',
    'v2beta3',
  ];
  const invalidVersions = [
    '',
    '1',
    'v',
    'valpha1',
    'v1gamma1',
    'v1 alpha1',
    'V1alpha1',
  ];

  it.each(validVersions)('accepts valid api_version "%s"', version => {
    const form = { ...validForm(), api_version: version };
    expect(isInstanceFormValid(form)).toBe(true);
  });

  it.each(invalidVersions)('rejects invalid api_version "%s"', version => {
    const form = { ...validForm(), api_version: version };
    const errors = validateInstanceForm(form);
    expect(errors.api_version).toBeDefined();
  });

  /**
   * ReDoS guard — the old regex /^v\d+(alpha|beta)?\d*$/ could take O(N²)
   * steps for "v" + "1".repeat(N) + "!".  The rewritten regex must complete
   * in well under 100 ms even for a 10,000-digit input.
   */
  it('completes in linear time for a pathological non-matching input', () => {
    const malicious = `v${'1'.repeat(10_000)}!`;
    const form = { ...validForm(), api_version: malicious };

    const start = Date.now();
    const errors = validateInstanceForm(form);
    const elapsed = Date.now() - start;

    expect(errors.api_version).toBeDefined();
    expect(elapsed).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// display_name validation
// ---------------------------------------------------------------------------

describe('display_name validation', () => {
  it('rejects an empty display name', () => {
    const errors = validateInstanceForm({ ...validForm(), display_name: '' });
    expect(errors.display_name).toBeDefined();
  });

  it('rejects a display name longer than 63 characters', () => {
    const errors = validateInstanceForm({
      ...validForm(),
      display_name: 'a'.repeat(64),
    });
    expect(errors.display_name).toBeDefined();
  });

  it('accepts a display name of exactly 63 characters', () => {
    const form = { ...validForm(), display_name: 'a'.repeat(63) };
    expect(isInstanceFormValid(form)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// catalog_item_id validation
// ---------------------------------------------------------------------------

describe('catalog_item_id validation', () => {
  it('rejects a missing catalog item', () => {
    const errors = validateInstanceForm({
      ...validForm(),
      catalog_item_id: '',
    });
    expect(errors.catalog_item_id).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// buildUserValueRows
// ---------------------------------------------------------------------------

describe('buildUserValueRows', () => {
  it('returns empty array when item is undefined', () => {
    expect(buildUserValueRows(undefined)).toEqual([]);
  });

  it('returns empty array when item has no spec fields', () => {
    const item = {} as CatalogItem;
    expect(buildUserValueRows(item)).toEqual([]);
  });

  it('only returns editable fields', () => {
    const item: CatalogItem = {
      spec: {
        fields: [
          { path: 'a', editable: true, display_name: 'Field A' },
          { path: 'b', editable: false, display_name: 'Field B' },
        ],
      },
    };
    const rows = buildUserValueRows(item);
    expect(rows).toHaveLength(1);
    expect(rows[0].path).toBe('a');
  });

  it('uses path as displayName when display_name is absent', () => {
    const item: CatalogItem = {
      spec: { fields: [{ path: 'myPath', editable: true }] },
    };
    const rows = buildUserValueRows(item);
    expect(rows[0].displayName).toBe('myPath');
  });

  it('converts default value to string', () => {
    const item: CatalogItem = {
      spec: { fields: [{ path: 'x', editable: true, default: 42 }] },
    };
    expect(buildUserValueRows(item)[0].value).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// formToInstance
// ---------------------------------------------------------------------------

describe('formToInstance', () => {
  it('maps form fields correctly', () => {
    const form = {
      ...validForm(),
      user_values: [
        { path: 'cpu', displayName: 'CPU', value: '4' },
        { path: 'mem', displayName: 'Mem', value: '  ' }, // blank — should be filtered
      ],
    };
    const instance = formToInstance(form);
    expect(instance.api_version).toBe('v1alpha1');
    expect(instance.display_name).toBe('My Instance');
    expect(instance.spec.catalog_item_id).toBe('catalog-item-1');
    expect(instance.spec.user_values).toHaveLength(1);
    expect(instance.spec.user_values[0]).toEqual({ path: 'cpu', value: '4' });
  });

  it('trims whitespace from string fields', () => {
    const form = {
      ...validForm(),
      display_name: '  trimmed  ',
      api_version: ' v1 ',
    };
    const instance = formToInstance(form);
    expect(instance.display_name).toBe('trimmed');
    expect(instance.api_version).toBe('v1');
  });
});
