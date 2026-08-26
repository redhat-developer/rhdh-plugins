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
  validateResourceEntry,
  validateFieldRows,
  isCatalogItemFormValid,
  catalogItemToForm,
  formToCatalogItem,
  emptyFieldRow,
  emptyResourceFormEntry,
  emptyCatalogItemForm,
} from './catalogItemFormTypes';
import type {
  ResourceFormEntry,
  FieldRow,
  CatalogItemForm,
} from './catalogItemFormTypes';
import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let uuidCount = 0;
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `uuid-${++uuidCount}` },
    writable: true,
    configurable: true,
  });
});

function makeResource(
  overrides: Partial<ResourceFormEntry> = {},
): ResourceFormEntry {
  return {
    ...emptyResourceFormEntry(),
    name: 'app',
    service_type: 'vm',
    ...overrides,
  };
}

function makeField(overrides: Partial<FieldRow> = {}): FieldRow {
  return { ...emptyFieldRow(), path: 'config.replicas', ...overrides };
}

function validForm(): CatalogItemForm {
  return {
    display_name: 'My Item',
    api_version: 'v1alpha1',
    resources: [
      {
        ...emptyResourceFormEntry(),
        name: 'app',
        service_type: 'vm',
        fields: [makeField()],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// validateResourceEntry
// ---------------------------------------------------------------------------

describe('validateResourceEntry', () => {
  it('passes for a valid entry', () => {
    const entry = makeResource();
    expect(validateResourceEntry(entry, ['app'])).toEqual({});
  });

  it('rejects empty name', () => {
    const entry = makeResource({ name: '' });
    const errs = validateResourceEntry(entry, ['']);
    expect(errs.name).toBeDefined();
  });

  it('rejects duplicate name', () => {
    const entry = makeResource({ name: 'app' });
    const errs = validateResourceEntry(entry, ['app', 'app']);
    expect(errs.name).toBeDefined();
  });

  it('rejects name that starts with a digit', () => {
    const entry = makeResource({ name: '1app' });
    const errs = validateResourceEntry(entry, ['1app']);
    expect(errs.name).toBeDefined();
  });

  it('rejects name with illegal characters', () => {
    const entry = makeResource({ name: 'my app' });
    const errs = validateResourceEntry(entry, ['my app']);
    expect(errs.name).toBeDefined();
  });

  it('accepts name with hyphens and underscores', () => {
    const entry = makeResource({ name: 'my-app_1' });
    expect(validateResourceEntry(entry, ['my-app_1'])).toEqual({});
  });

  it('rejects empty service_type', () => {
    const entry = makeResource({ service_type: '' });
    const errs = validateResourceEntry(entry, ['app']);
    expect(errs.service_type).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// validateFieldRows — required-field boolean is now allowed
// ---------------------------------------------------------------------------

describe('validateFieldRows', () => {
  it('does not error when validation_schema has required: true', () => {
    const field = makeField({
      validation_schema: JSON.stringify({ type: 'string', required: true }),
    });
    const errs = validateFieldRows([field]);
    expect(errs[0]).toBeUndefined();
  });

  it('errors on invalid JSON in validation_schema', () => {
    const field = makeField({ validation_schema: '{ not json' });
    const errs = validateFieldRows([field]);
    expect(errs[0]?.validation_schema).toBeDefined();
  });

  it('errors when validation_schema is not an object', () => {
    const field = makeField({
      validation_schema: JSON.stringify([1, 2, 3]),
    });
    const errs = validateFieldRows([field]);
    expect(errs[0]?.validation_schema).toBeDefined();
  });

  it('errors on duplicate paths', () => {
    const f1 = makeField({ path: 'dup.path', id: 'id1' });
    const f2 = makeField({ path: 'dup.path', id: 'id2' });
    const errs = validateFieldRows([f1, f2]);
    expect(errs[1]?.path).toBeDefined();
  });

  it('errors when minimum exceeds maximum', () => {
    const field = makeField({
      validation_schema: JSON.stringify({
        type: 'integer',
        minimum: 10,
        maximum: 5,
      }),
    });
    const errs = validateFieldRows([field]);
    expect(errs[0]?.validation_schema).toBeDefined();
  });

  it('passes a clean field row', () => {
    const errs = validateFieldRows([makeField()]);
    expect(errs).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// isCatalogItemFormValid — multi-resource
// ---------------------------------------------------------------------------

describe('isCatalogItemFormValid — multi-resource', () => {
  it('returns true for a valid two-resource form', () => {
    const form: CatalogItemForm = {
      display_name: 'Multi',
      api_version: 'v1alpha1',
      resources: [
        {
          ...emptyResourceFormEntry(),
          name: 'app',
          service_type: 'vm',
          fields: [makeField({ path: 'a' })],
        },
        {
          ...emptyResourceFormEntry(),
          name: 'db',
          service_type: 'postgres',
          fields: [makeField({ path: 'b' })],
        },
      ],
    };
    expect(isCatalogItemFormValid(form)).toBe(true);
  });

  it('returns false when one resource has an invalid name', () => {
    const form: CatalogItemForm = {
      display_name: 'Multi',
      api_version: 'v1alpha1',
      resources: [
        {
          ...emptyResourceFormEntry(),
          name: 'app',
          service_type: 'vm',
          fields: [makeField({ path: 'a' })],
        },
        {
          ...emptyResourceFormEntry(),
          name: '',
          service_type: 'postgres',
          fields: [makeField({ path: 'b' })],
        },
      ],
    };
    expect(isCatalogItemFormValid(form)).toBe(false);
  });

  it('returns false when resources have duplicate names', () => {
    const form: CatalogItemForm = {
      display_name: 'Multi',
      api_version: 'v1alpha1',
      resources: [
        {
          ...emptyResourceFormEntry(),
          name: 'app',
          service_type: 'vm',
          fields: [makeField({ path: 'a' })],
        },
        {
          ...emptyResourceFormEntry(),
          name: 'app',
          service_type: 'postgres',
          fields: [makeField({ path: 'b' })],
        },
      ],
    };
    expect(isCatalogItemFormValid(form)).toBe(false);
  });

  it('returns false with no resources', () => {
    const form = {
      ...emptyCatalogItemForm(),
      display_name: 'X',
      api_version: 'v1',
    };
    expect(isCatalogItemFormValid(form)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// catalogItemToForm — multi-resource round-trip
// ---------------------------------------------------------------------------

describe('catalogItemToForm', () => {
  it('maps multiple resources correctly', () => {
    const item: CatalogItem = {
      display_name: 'Multi Item',
      api_version: 'v1alpha1',
      spec: {
        resources: [
          {
            name: 'app',
            service_type: 'vm',
            requires_resources: ['db'],
            fields: [
              { path: 'replicas', display_name: 'Replicas', editable: true },
            ],
          },
          {
            name: 'db',
            service_type: 'postgres',
            fields: [],
          },
        ],
      },
    };
    const form = catalogItemToForm(item);
    expect(form.resources).toHaveLength(2);
    expect(form.resources[0].name).toBe('app');
    expect(form.resources[0].service_type).toBe('vm');
    expect(form.resources[0].requires_resources).toEqual(['db']);
    expect(form.resources[0].fields[0].path).toBe('replicas');
    expect(form.resources[1].name).toBe('db');
  });

  it('returns empty resources array for item with no spec', () => {
    const form = catalogItemToForm({} as CatalogItem);
    expect(form.resources).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// formToCatalogItem — multi-resource
// ---------------------------------------------------------------------------

describe('formToCatalogItem', () => {
  it('serialises two resources with correct fields', () => {
    const item = formToCatalogItem(validForm());
    expect(item.spec?.resources).toHaveLength(1);
    expect(item.spec?.resources?.[0].name).toBe('app');
    expect(item.spec?.resources?.[0].service_type).toBe('vm');
    expect(item.spec?.resources?.[0].fields).toHaveLength(1);
    expect(item.spec?.resources?.[0].fields?.[0].path).toBe('config.replicas');
  });

  it('omits fields with empty paths', () => {
    const form = validForm();
    form.resources[0].fields.push(makeField({ path: '   ' }));
    const item = formToCatalogItem(form);
    expect(item.spec?.resources?.[0].fields).toHaveLength(1);
  });
});
