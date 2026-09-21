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

import { ConfigReader } from '@backstage/config';
import {
  isConnectorEnabled,
  safeGetOptionalString,
  validateConnectorStartupConfig,
} from './config';

describe('safeGetOptionalString', () => {
  it('returns the string when present', () => {
    const config = new ConfigReader({ endpoint: 'https://example.com' });
    expect(safeGetOptionalString(config, 'endpoint')).toBe(
      'https://example.com',
    );
  });

  it('returns undefined when the key is missing', () => {
    const config = new ConfigReader({});
    expect(safeGetOptionalString(config, 'endpoint')).toBeUndefined();
  });

  it('returns undefined when ConfigReader throws on empty-string values', () => {
    // ConfigReader.getOptionalString() throws TypeError for empty strings
    // (e.g. from env var substitution like ${VAR:-}).
    const config = new ConfigReader({ endpoint: '' });
    expect(safeGetOptionalString(config, 'endpoint')).toBeUndefined();
  });
});

describe('isConnectorEnabled', () => {
  it('returns true when enabled is true', () => {
    const config = new ConfigReader({ enabled: true });
    expect(isConnectorEnabled(config)).toBe(true);
  });

  it('returns false when enabled is false', () => {
    const config = new ConfigReader({ enabled: false });
    expect(isConnectorEnabled(config)).toBe(false);
  });

  it('returns true when enabled is omitted (default)', () => {
    const config = new ConfigReader({});
    expect(isConnectorEnabled(config)).toBe(true);
  });

  it('returns true when enabled is omitted in a config with other fields', () => {
    const config = new ConfigReader({
      endpoint: 'https://example.com',
    });
    expect(isConnectorEnabled(config)).toBe(true);
  });
});

describe('validateConnectorStartupConfig', () => {
  describe('endpoint validation', () => {
    it('accepts a valid HTTPS URL', () => {
      const config = new ConfigReader({
        endpoint: 'https://registry.example.com',
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).not.toThrow();
    });

    it('rejects an HTTP URL', () => {
      const config = new ConfigReader({
        endpoint: 'http://registry.example.com',
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).toThrow(/Must use HTTPS protocol/);
    });

    it('rejects an invalid URL', () => {
      const config = new ConfigReader({
        endpoint: 'not-a-url',
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).toThrow(/Must be a valid HTTPS URL/);
    });

    it('allows missing endpoint when field is optional', () => {
      const config = new ConfigReader({});
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).not.toThrow();
    });

    it('rejects a wrong-typed endpoint value', () => {
      const config = new ConfigReader({
        endpoint: { nested: true },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).toThrow(/Invalid endpoint.*empty or not a string/);
    });

    it('rejects an empty-string endpoint when the key is present', () => {
      // ConfigReader throws TypeError for empty strings; validation must
      // surface that as a startup failure, not treat it as "missing".
      const config = new ConfigReader({
        endpoint: '',
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: [],
          endpointField: 'endpoint',
        }),
      ).toThrow(/Invalid endpoint/);
    });
  });

  describe('credential validation', () => {
    it('rejects empty credential values', () => {
      const config = new ConfigReader({
        auth: { token: '' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
        }),
      ).toThrow(/Credential field 'auth.token' is invalid/);
    });

    it('rejects whitespace-only credential values', () => {
      const config = new ConfigReader({
        auth: { token: '   ' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
        }),
      ).toThrow(/Credential field 'auth.token' is invalid/);
    });

    it('allows missing credential fields (optional)', () => {
      const config = new ConfigReader({});
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
        }),
      ).not.toThrow();
    });

    it('accepts non-empty credential values (resolved $env)', () => {
      // In production, Backstage resolves { $env: "VAR" } at config
      // loading time. By the time our code sees it, the value is a
      // plain string. Simulate the resolved value directly.
      const config = new ConfigReader({
        auth: { token: 'resolved-token-value' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
        }),
      ).not.toThrow();
    });

    it('validates multiple credential fields', () => {
      const config = new ConfigReader({
        auth: { clientId: 'valid-id', clientSecret: '' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.clientId', 'auth.clientSecret'],
        }),
      ).toThrow(/Credential field 'auth.clientSecret' is invalid/);
    });
  });

  describe('combined validation', () => {
    it('validates both credentials and endpoint in one call', () => {
      // Simulate resolved $env value
      const config = new ConfigReader({
        endpoint: 'https://registry.example.com',
        auth: { token: 'my-resolved-token' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
          endpointField: 'endpoint',
        }),
      ).not.toThrow();
    });

    it('provides descriptive error with example', () => {
      const config = new ConfigReader({
        auth: { token: '' },
      });
      expect(() =>
        validateConnectorStartupConfig(config, {
          credentialFields: ['auth.token'],
        }),
      ).toThrow(/auth\.token.*\$env.*K8s Secrets/s);
    });
  });
});
