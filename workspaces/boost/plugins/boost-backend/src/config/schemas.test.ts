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

import { ZodError } from 'zod';
import {
  boostConfigFields,
  BOOST_CONFIG_SCHEMA_VERSION,
  validateConfigValue,
  isDbWritable,
  isSensitiveField,
} from './schemas';

describe('boostConfigFields', () => {
  it('has a positive schema version', () => {
    expect(BOOST_CONFIG_SCHEMA_VERSION).toBeGreaterThan(0);
  });

  it('has entries for all expected config keys', () => {
    const keys = Object.keys(boostConfigFields);
    expect(keys).toContain('boost.model.baseUrl');
    expect(keys).toContain('boost.model.name');
    expect(keys).toContain('boost.systemPrompt');
    expect(keys).toContain('boost.security.mode');
    expect(keys).toContain('boost.features.agentCreation');
    expect(keys).toContain('boost.agentApproval.mode');
    expect(keys).toContain('boost.skillsMarketplace.enabled');
    expect(keys).toContain('boost.kagenti.auth.tokenExchange.enabled');
    expect(keys).toContain('boost.encryptionSecret');
    expect(keys).toContain('boost.devSpaces.credentials');
  });

  it('annotates each field with a valid configScope', () => {
    for (const [key, field] of Object.entries(boostConfigFields)) {
      expect(['yaml-only', 'db-overridable', 'db-only']).toContain(
        field.configScope,
      );
      expect(field.description).toBeTruthy();
      expect(typeof key).toBe('string');
    }
  });
});

describe('validateConfigValue', () => {
  it('validates a valid model base URL', () => {
    expect(
      validateConfigValue('boost.model.baseUrl', 'https://example.com/api'),
    ).toBe('https://example.com/api');
  });

  it('rejects an invalid URL for model base URL', () => {
    expect(() =>
      validateConfigValue('boost.model.baseUrl', 'not-a-url'),
    ).toThrow(ZodError);
  });

  it('validates a valid security mode', () => {
    expect(validateConfigValue('boost.security.mode', 'full')).toBe('full');
  });

  it('rejects an invalid security mode', () => {
    expect(() => validateConfigValue('boost.security.mode', 'invalid')).toThrow(
      ZodError,
    );
  });

  it('validates a boolean feature flag', () => {
    expect(validateConfigValue('boost.features.agentCreation', true)).toBe(
      true,
    );
  });

  it('validates optional fields accept undefined', () => {
    expect(
      validateConfigValue('boost.systemPrompt', undefined),
    ).toBeUndefined();
  });

  it('validates agent approval mode enum', () => {
    expect(validateConfigValue('boost.agentApproval.mode', 'built-in')).toBe(
      'built-in',
    );
    expect(validateConfigValue('boost.agentApproval.mode', 'sonataflow')).toBe(
      'sonataflow',
    );
  });

  it('rejects invalid agent approval mode', () => {
    expect(() =>
      validateConfigValue('boost.agentApproval.mode', 'invalid'),
    ).toThrow(ZodError);
  });

  it('validates model name requires non-empty string', () => {
    expect(() => validateConfigValue('boost.model.name', '')).toThrow(ZodError);
  });
});

describe('isDbWritable', () => {
  it('returns true for db-overridable fields', () => {
    expect(isDbWritable('boost.model.baseUrl')).toBe(true);
    expect(isDbWritable('boost.model.name')).toBe(true);
    expect(isDbWritable('boost.systemPrompt')).toBe(true);
    expect(isDbWritable('boost.features.agentCreation')).toBe(true);
  });

  it('returns false for yaml-only fields', () => {
    expect(isDbWritable('boost.security.mode')).toBe(false);
    expect(isDbWritable('boost.agentApproval.sonataflow.endpoint')).toBe(false);
    expect(isDbWritable('boost.kagenti.auth.tokenExchange.enabled')).toBe(
      false,
    );
    expect(isDbWritable('boost.encryptionSecret')).toBe(false);
  });
});

describe('isSensitiveField', () => {
  it('returns true for sensitive fields', () => {
    expect(isSensitiveField('boost.encryptionSecret')).toBe(true);
    expect(isSensitiveField('boost.devSpaces.credentials')).toBe(true);
  });

  it('returns false for non-sensitive fields', () => {
    expect(isSensitiveField('boost.model.baseUrl')).toBe(false);
    expect(isSensitiveField('boost.security.mode')).toBe(false);
  });
});
