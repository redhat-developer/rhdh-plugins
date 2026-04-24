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
  emptyProviderForm,
  formToProvider,
  isProviderFormValid,
  nameToDisplayName,
  providerToForm,
  validateProviderForm,
} from './providerFormTypes';

describe('nameToDisplayName', () => {
  it('converts a slug to title case', () => {
    expect(nameToDisplayName('my-k8s-provider')).toBe('My K8s Provider');
  });

  it('handles a single word', () => {
    expect(nameToDisplayName('alpha')).toBe('Alpha');
  });

  it('trims trailing/leading hyphens gracefully', () => {
    expect(nameToDisplayName('test')).toBe('Test');
  });
});

describe('validateProviderForm', () => {
  const valid = () => ({
    ...emptyProviderForm(),
    name: 'my-provider',
    endpoint: 'https://api.example.com',
    service_type: 'kubernetes',
    schema_version: 'v1alpha1',
  });

  it('returns no errors for a valid form', () => {
    expect(validateProviderForm(valid())).toEqual({});
  });

  it('requires a name matching the slug pattern', () => {
    const errors = validateProviderForm({ ...valid(), name: 'My Provider' });
    expect(errors.name).toBeDefined();
  });

  it('requires an endpoint starting with http(s)://', () => {
    const errors = validateProviderForm({ ...valid(), endpoint: 'sftp://bad' });
    expect(errors.endpoint).toBeDefined();
  });

  it('requires a service_type', () => {
    const errors = validateProviderForm({ ...valid(), service_type: '' });
    expect(errors.service_type).toBeDefined();
  });

  it('requires schema_version to match v<n>[alpha|beta]<n> pattern', () => {
    const errors = validateProviderForm({
      ...valid(),
      schema_version: 'version1',
    });
    expect(errors.schema_version).toBeDefined();
  });
});

describe('isProviderFormValid', () => {
  it('returns true for a fully valid form', () => {
    expect(
      isProviderFormValid({
        name: 'my-provider',
        endpoint: 'https://api:8080',
        service_type: 'k8s',
        schema_version: 'v1',
        operations: [],
      }),
    ).toBe(true);
  });

  it('returns false when any field is invalid', () => {
    expect(
      isProviderFormValid({
        ...emptyProviderForm(),
        endpoint: 'https://api:8080',
        service_type: 'k8s',
        schema_version: 'v1',
      }),
    ).toBe(false);
  });
});

describe('providerToForm / formToProvider round-trip', () => {
  it('round-trips without data loss', () => {
    const form = {
      name: 'my-provider',
      endpoint: 'https://api.example.com',
      service_type: 'kubernetes',
      schema_version: 'v1alpha1',
      operations: ['create', 'delete'],
    };
    const provider = formToProvider(form);
    const back = providerToForm(provider);
    expect(back.name).toBe(form.name);
    expect(back.endpoint).toBe(form.endpoint);
    expect(back.service_type).toBe(form.service_type);
    expect(back.schema_version).toBe(form.schema_version);
    expect(back.operations).toEqual(form.operations);
  });

  it('omits operations from the payload when empty', () => {
    const provider = formToProvider({
      ...emptyProviderForm(),
      name: 'x',
      endpoint: 'https://x',
      service_type: 'k8s',
      schema_version: 'v1',
    });
    expect(provider.operations).toBeUndefined();
  });
});
