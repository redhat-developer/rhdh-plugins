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
  BOOST_CONNECTOR_SCHEMA_VERSION,
  CONNECTOR_IDS,
  validateConfigValue,
  isDbWritable,
  isSensitiveField,
  isValidCronExpression,
  getFieldDefault,
} from './schemas';

describe('boostConfigFields', () => {
  it('has schema version 5', () => {
    expect(BOOST_CONFIG_SCHEMA_VERSION).toBe(5);
  });

  it('has entries for all expected config keys', () => {
    const keys = Object.keys(boostConfigFields);
    expect(keys).toContain('boost.model.baseUrl');
    expect(keys).toContain('boost.model.name');
    expect(keys).toContain('boost.systemPrompt');
    expect(keys).toContain('boost.security.mode');
    expect(keys).toContain('boost.features.agentCreation');
    expect(keys).toContain('boost.agentApproval.mode');
    expect(keys).toContain('boost.kagenti.auth.tokenEndpoint');
    expect(keys).toContain('boost.kagenti.auth.clientId');
    expect(keys).toContain('boost.kagenti.auth.clientSecret');
    expect(keys).toContain('boost.kagenti.auth.tokenExpiryBufferSeconds');
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

  it('validates tokenExpiryBufferSeconds accepts valid integers', () => {
    expect(
      validateConfigValue('boost.kagenti.auth.tokenExpiryBufferSeconds', 60),
    ).toBe(60);
    expect(
      validateConfigValue('boost.kagenti.auth.tokenExpiryBufferSeconds', 0),
    ).toBe(0);
  });

  it('rejects negative tokenExpiryBufferSeconds', () => {
    expect(() =>
      validateConfigValue('boost.kagenti.auth.tokenExpiryBufferSeconds', -1),
    ).toThrow(ZodError);
  });

  it('rejects non-integer tokenExpiryBufferSeconds', () => {
    expect(() =>
      validateConfigValue('boost.kagenti.auth.tokenExpiryBufferSeconds', 1.5),
    ).toThrow(ZodError);
  });

  it('accepts undefined tokenExpiryBufferSeconds', () => {
    expect(
      validateConfigValue(
        'boost.kagenti.auth.tokenExpiryBufferSeconds',
        undefined,
      ),
    ).toBeUndefined();
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
    expect(isDbWritable('boost.kagenti.auth.tokenEndpoint')).toBe(false);
    expect(isDbWritable('boost.kagenti.auth.clientId')).toBe(false);
    expect(isDbWritable('boost.kagenti.auth.clientSecret')).toBe(false);
    expect(isDbWritable('boost.kagenti.auth.tokenExpiryBufferSeconds')).toBe(
      false,
    );
    expect(isDbWritable('boost.encryptionSecret')).toBe(false);
  });
});

describe('isSensitiveField', () => {
  it('returns true for sensitive fields', () => {
    expect(isSensitiveField('boost.encryptionSecret')).toBe(true);
    expect(isSensitiveField('boost.devSpaces.credentials')).toBe(true);
    expect(isSensitiveField('boost.kagenti.auth.clientSecret')).toBe(true);
  });

  it('returns false for non-sensitive fields', () => {
    expect(isSensitiveField('boost.model.baseUrl')).toBe(false);
    expect(isSensitiveField('boost.security.mode')).toBe(false);
  });
});

describe('isValidCronExpression', () => {
  it('accepts valid 5-field cron expressions', () => {
    expect(isValidCronExpression('* * * * *')).toBe(true);
    expect(isValidCronExpression('0 9 * * 1-5')).toBe(true);
    expect(isValidCronExpression('*/5 * * * *')).toBe(true);
    expect(isValidCronExpression('0 0 1 1 *')).toBe(true);
    expect(isValidCronExpression('0,30 9-17 * * 1,3,5')).toBe(true);
  });

  it('accepts named month and weekday values in correct fields', () => {
    expect(isValidCronExpression('0 9 * JAN-MAR *')).toBe(true);
    expect(isValidCronExpression('0 0 * * MON-FRI')).toBe(true);
  });

  it('rejects ? wildcard (unsupported by SchedulerService CronTime)', () => {
    expect(isValidCronExpression('0 0 ? * MON')).toBe(false);
    expect(isValidCronExpression('0 0 ? * MON-FRI')).toBe(false);
  });

  it('rejects out-of-range numeric values', () => {
    expect(isValidCronExpression('60 * * * *')).toBe(false);
    expect(isValidCronExpression('* 24 * * *')).toBe(false);
    expect(isValidCronExpression('* * 32 * *')).toBe(false);
    expect(isValidCronExpression('* * * 13 *')).toBe(false);
    expect(isValidCronExpression('* * * * 8')).toBe(false);
  });

  it('rejects zero step divisor (division by zero)', () => {
    expect(isValidCronExpression('*/0 * * * *')).toBe(false);
    expect(isValidCronExpression('* */0 * * *')).toBe(false);
    expect(isValidCronExpression('1-10/0 * * * *')).toBe(false);
  });

  it('accepts valid step divisors', () => {
    expect(isValidCronExpression('*/1 * * * *')).toBe(true);
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
    expect(isValidCronExpression('0-30/5 * * * *')).toBe(true);
  });

  it('rejects arbitrary three-letter strings as month/weekday names', () => {
    expect(isValidCronExpression('0 0 * XYZ *')).toBe(false);
    expect(isValidCronExpression('0 0 * * ABC')).toBe(false);
    expect(isValidCronExpression('0 0 * FOO *')).toBe(false);
  });

  it('rejects named tokens in wrong field position', () => {
    // Month names in minute field
    expect(isValidCronExpression('JAN * * * *')).toBe(false);
    // Weekday names in month field
    expect(isValidCronExpression('0 0 * MON *')).toBe(false);
    // Weekday names in minute / hour / day-of-month fields
    expect(isValidCronExpression('SUN * * * *')).toBe(false);
    expect(isValidCronExpression('0 MON * * *')).toBe(false);
    expect(isValidCronExpression('0 0 MON * *')).toBe(false);
    // Month name in day-of-week field
    expect(isValidCronExpression('0 0 * * JAN')).toBe(false);
  });

  it('accepts all valid month names (case-insensitive)', () => {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    months.forEach(m => {
      expect(isValidCronExpression(`0 0 * ${m} *`)).toBe(true);
    });
  });

  it('accepts all valid weekday names', () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    days.forEach(d => {
      expect(isValidCronExpression(`0 0 * * ${d}`)).toBe(true);
    });
  });

  it('rejects invalid cron expressions', () => {
    expect(isValidCronExpression('not-a-cron')).toBe(false);
    expect(isValidCronExpression('* * *')).toBe(false);
    expect(isValidCronExpression('* * * * * *')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });
});

describe('connector config schemas', () => {
  describe('field registration', () => {
    it('registers all Jira connector fields', () => {
      const keys = Object.keys(boostConfigFields);
      expect(keys).toContain('boost.connectors.jira.enabled');
      expect(keys).toContain('boost.connectors.jira.endpoint');
      expect(keys).toContain('boost.connectors.jira.schedule.intervalMs');
      expect(keys).toContain('boost.connectors.jira.schedule.cron');
      expect(keys).toContain('boost.connectors.jira.batchSize');
      expect(keys).toContain('boost.connectors.jira.timeout.connectionMs');
    });

    it('registers all GitHub connector fields', () => {
      const keys = Object.keys(boostConfigFields);
      expect(keys).toContain('boost.connectors.github.enabled');
      expect(keys).toContain('boost.connectors.github.endpoint');
      expect(keys).toContain('boost.connectors.github.schedule.intervalMs');
      expect(keys).toContain('boost.connectors.github.batchSize');
    });

    it('registers all GitLab connector fields', () => {
      const keys = Object.keys(boostConfigFields);
      expect(keys).toContain('boost.connectors.gitlab.enabled');
      expect(keys).toContain('boost.connectors.gitlab.endpoint');
      expect(keys).toContain('boost.connectors.gitlab.schedule.intervalMs');
      expect(keys).toContain('boost.connectors.gitlab.batchSize');
    });

    it('does not register Jira-only fields for GitHub', () => {
      const keys = Object.keys(boostConfigFields);
      expect(keys).not.toContain('boost.connectors.github.schedule.cron');
      expect(keys).not.toContain(
        'boost.connectors.github.timeout.connectionMs',
      );
    });

    it('does not register Jira-only fields for GitLab', () => {
      const keys = Object.keys(boostConfigFields);
      expect(keys).not.toContain('boost.connectors.gitlab.schedule.cron');
      expect(keys).not.toContain(
        'boost.connectors.gitlab.timeout.connectionMs',
      );
    });

    it('marks all non-metadata connector fields as db-overridable', () => {
      const connectorEntries = Object.entries(boostConfigFields).filter(
        ([key]) =>
          key.startsWith('boost.connectors.') &&
          !key.endsWith('.__schemaVersion'),
      );
      expect(connectorEntries.length).toBeGreaterThan(0);
      connectorEntries.forEach(([, field]) => {
        expect(field.configScope).toBe('db-overridable');
      });
    });
  });

  describe('endpoint validation', () => {
    const endpointKeys = [
      'boost.connectors.jira.endpoint',
      'boost.connectors.github.endpoint',
      'boost.connectors.gitlab.endpoint',
    ] as const;

    it.each(endpointKeys)('%s accepts valid HTTPS URL', key => {
      expect(validateConfigValue(key, 'https://example.com')).toBe(
        'https://example.com',
      );
    });

    it.each(endpointKeys)('%s rejects HTTP URL', key => {
      expect(() => validateConfigValue(key, 'http://example.com')).toThrow(
        ZodError,
      );
    });

    it.each(endpointKeys)('%s rejects non-URL string', key => {
      expect(() => validateConfigValue(key, 'not-a-url')).toThrow(ZodError);
    });

    it.each(endpointKeys)('%s accepts undefined', key => {
      expect(validateConfigValue(key, undefined)).toBeUndefined();
    });
  });

  describe('numeric field validation', () => {
    it('accepts positive schedule.intervalMs', () => {
      expect(
        validateConfigValue(
          'boost.connectors.jira.schedule.intervalMs',
          300000,
        ),
      ).toBe(300000);
    });

    it('rejects negative schedule.intervalMs', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.schedule.intervalMs', -1000),
      ).toThrow(ZodError);
    });

    it('rejects zero schedule.intervalMs', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.schedule.intervalMs', 0),
      ).toThrow(ZodError);
    });

    it('accepts positive batchSize', () => {
      expect(validateConfigValue('boost.connectors.jira.batchSize', 100)).toBe(
        100,
      );
    });

    it('rejects negative batchSize', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.batchSize', -50),
      ).toThrow(ZodError);
    });

    it('accepts positive timeout.connectionMs', () => {
      expect(
        validateConfigValue(
          'boost.connectors.jira.timeout.connectionMs',
          30000,
        ),
      ).toBe(30000);
    });

    it('rejects negative timeout.connectionMs', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.timeout.connectionMs', -100),
      ).toThrow(ZodError);
    });

    it('accepts undefined for optional numeric fields', () => {
      expect(
        validateConfigValue(
          'boost.connectors.github.schedule.intervalMs',
          undefined,
        ),
      ).toBeUndefined();
      expect(
        validateConfigValue('boost.connectors.github.batchSize', undefined),
      ).toBeUndefined();
    });

    it('rejects non-integer schedule.intervalMs', () => {
      expect(() =>
        validateConfigValue(
          'boost.connectors.jira.schedule.intervalMs',
          300000.5,
        ),
      ).toThrow(ZodError);
    });

    it('rejects non-integer batchSize', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.batchSize', 99.9),
      ).toThrow(ZodError);
    });

    it('rejects non-integer timeout.connectionMs', () => {
      expect(() =>
        validateConfigValue(
          'boost.connectors.jira.timeout.connectionMs',
          30000.1,
        ),
      ).toThrow(ZodError);
    });

    it('rejects batchSize exceeding upper bound', () => {
      expect(() =>
        validateConfigValue('boost.connectors.jira.batchSize', 10001),
      ).toThrow(ZodError);
    });

    it('accepts batchSize at upper bound', () => {
      expect(
        validateConfigValue('boost.connectors.jira.batchSize', 10000),
      ).toBe(10000);
    });

    it('rejects intervalMs exceeding upper bound', () => {
      expect(() =>
        validateConfigValue(
          'boost.connectors.jira.schedule.intervalMs',
          86400001,
        ),
      ).toThrow(ZodError);
    });

    it('accepts intervalMs at upper bound', () => {
      expect(
        validateConfigValue(
          'boost.connectors.jira.schedule.intervalMs',
          86400000,
        ),
      ).toBe(86400000);
    });

    it('rejects timeout.connectionMs exceeding upper bound', () => {
      expect(() =>
        validateConfigValue(
          'boost.connectors.jira.timeout.connectionMs',
          300001,
        ),
      ).toThrow(ZodError);
    });

    it('accepts timeout.connectionMs at upper bound', () => {
      expect(
        validateConfigValue(
          'boost.connectors.jira.timeout.connectionMs',
          300000,
        ),
      ).toBe(300000);
    });
  });

  describe('cron expression validation', () => {
    it('accepts valid cron expression for Jira schedule', () => {
      expect(
        validateConfigValue(
          'boost.connectors.jira.schedule.cron',
          '*/5 * * * *',
        ),
      ).toBe('*/5 * * * *');
    });

    it('rejects invalid cron expression for Jira schedule', () => {
      expect(() =>
        validateConfigValue(
          'boost.connectors.jira.schedule.cron',
          'not-a-cron',
        ),
      ).toThrow(ZodError);
    });

    it('accepts undefined for optional cron field', () => {
      expect(
        validateConfigValue('boost.connectors.jira.schedule.cron', undefined),
      ).toBeUndefined();
    });
  });

  describe('enabled field validation', () => {
    const enabledKeys = [
      'boost.connectors.jira.enabled',
      'boost.connectors.github.enabled',
      'boost.connectors.gitlab.enabled',
    ] as const;

    it.each(enabledKeys)('%s accepts boolean true', key => {
      expect(validateConfigValue(key, true)).toBe(true);
    });

    it.each(enabledKeys)('%s accepts boolean false', key => {
      expect(validateConfigValue(key, false)).toBe(false);
    });

    it.each(enabledKeys)('%s accepts undefined', key => {
      expect(validateConfigValue(key, undefined)).toBeUndefined();
    });
  });

  describe('isDbWritable for connector fields', () => {
    it('returns true for all connector fields', () => {
      const connectorKeys = Object.keys(boostConfigFields).filter(key =>
        key.startsWith('boost.connectors.'),
      ) as Array<keyof typeof boostConfigFields>;
      expect(connectorKeys.length).toBeGreaterThan(0);
      connectorKeys.forEach(key => {
        expect(isDbWritable(key)).toBe(true);
      });
    });
  });

  describe('__schemaVersion leaves', () => {
    it('has BOOST_CONNECTOR_SCHEMA_VERSION set to 1', () => {
      expect(BOOST_CONNECTOR_SCHEMA_VERSION).toBe(1);
    });

    it('exports CONNECTOR_IDS with jira, github, gitlab', () => {
      expect(CONNECTOR_IDS).toEqual(['jira', 'github', 'gitlab']);
    });

    it.each(CONNECTOR_IDS)(
      'registers __schemaVersion leaf for %s connector',
      connectorId => {
        const key = `boost.connectors.${connectorId}.__schemaVersion`;
        expect(Object.keys(boostConfigFields)).toContain(key);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s has configScope db-only',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(boostConfigFields[key].configScope).toBe('db-only');
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s is db-writable',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(isDbWritable(key)).toBe(true);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s accepts positive integer',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(validateConfigValue(key, 1)).toBe(1);
        expect(validateConfigValue(key, 2)).toBe(2);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s accepts undefined',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(validateConfigValue(key, undefined)).toBeUndefined();
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s rejects negative number',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(() => validateConfigValue(key, -1)).toThrow(ZodError);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s rejects zero',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(() => validateConfigValue(key, 0)).toThrow(ZodError);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s rejects non-integer',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(() => validateConfigValue(key, 1.5)).toThrow(ZodError);
      },
    );

    it.each(CONNECTOR_IDS)(
      '__schemaVersion for %s is not marked as sensitive',
      connectorId => {
        const key =
          `boost.connectors.${connectorId}.__schemaVersion` as keyof typeof boostConfigFields;
        expect(isSensitiveField(key)).toBe(false);
      },
    );
  });

  describe('getFieldDefault', () => {
    it('returns 300000 for all schedule.intervalMs fields', () => {
      expect(getFieldDefault('boost.connectors.jira.schedule.intervalMs')).toBe(
        300000,
      );
      expect(
        getFieldDefault('boost.connectors.github.schedule.intervalMs'),
      ).toBe(300000);
      expect(
        getFieldDefault('boost.connectors.gitlab.schedule.intervalMs'),
      ).toBe(300000);
    });

    it('returns 100 for all batchSize fields', () => {
      expect(getFieldDefault('boost.connectors.jira.batchSize')).toBe(100);
      expect(getFieldDefault('boost.connectors.github.batchSize')).toBe(100);
      expect(getFieldDefault('boost.connectors.gitlab.batchSize')).toBe(100);
    });

    it('returns 30000 for Jira timeout.connectionMs', () => {
      expect(
        getFieldDefault('boost.connectors.jira.timeout.connectionMs'),
      ).toBe(30000);
    });

    it('returns undefined for fields without defaults', () => {
      expect(getFieldDefault('boost.connectors.jira.enabled')).toBeUndefined();
      expect(getFieldDefault('boost.connectors.jira.endpoint')).toBeUndefined();
      expect(
        getFieldDefault('boost.connectors.jira.schedule.cron'),
      ).toBeUndefined();
      expect(getFieldDefault('boost.model.baseUrl')).toBeUndefined();
    });

    it('does not use Zod .default() on connector schemas', () => {
      const connectorKeys = Object.keys(boostConfigFields).filter(key =>
        key.startsWith('boost.connectors.'),
      ) as Array<keyof typeof boostConfigFields>;
      connectorKeys.forEach(key => {
        // validateConfigValue(key, undefined) must still return
        // undefined — Zod .default() would return the default instead
        expect(validateConfigValue(key, undefined)).toBeUndefined();
      });
    });
  });
});
