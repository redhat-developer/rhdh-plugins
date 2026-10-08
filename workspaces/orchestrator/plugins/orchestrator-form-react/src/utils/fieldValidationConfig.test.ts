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
  areAllGroupFieldsPopulated,
  getFieldValidationConfig,
  getGroupMembers,
  parseValidateOn,
} from './fieldValidationConfig';

describe('parseValidateOn', () => {
  it('parses "blur"', () => {
    expect(parseValidateOn('blur')).toEqual(['blur']);
  });

  it('parses "change"', () => {
    expect(parseValidateOn('change')).toEqual(['change']);
  });

  it('parses "blur,change"', () => {
    expect(parseValidateOn('blur,change')).toEqual(['blur', 'change']);
  });

  it('parses "change,blur" with spaces', () => {
    expect(parseValidateOn(' change , blur ')).toEqual(['change', 'blur']);
  });

  it('returns empty for undefined', () => {
    expect(parseValidateOn(undefined)).toEqual([]);
  });

  it('returns empty for non-string', () => {
    expect(parseValidateOn(42)).toEqual([]);
  });

  it('filters out invalid values', () => {
    expect(parseValidateOn('blur,invalid,change')).toEqual(['blur', 'change']);
  });
});

describe('getFieldValidationConfig', () => {
  it('returns config when ui:validateOn is set', () => {
    const uiSchema = {
      userId: {
        'ui:validateOn': 'blur',
      },
    };
    expect(getFieldValidationConfig(uiSchema, 'userId')).toEqual({
      validateOn: ['blur'],
      validateGroup: undefined,
    });
  });

  it('returns config with validateGroup', () => {
    const uiSchema = {
      namespace: {
        'ui:validateOn': 'blur',
        'ui:validateGroup': 'ns-cluster',
      },
    };
    expect(getFieldValidationConfig(uiSchema, 'namespace')).toEqual({
      validateOn: ['blur'],
      validateGroup: 'ns-cluster',
    });
  });

  it('returns undefined when no ui:validateOn', () => {
    const uiSchema = {
      userId: {
        'ui:widget': 'ActiveTextInput',
      },
    };
    expect(getFieldValidationConfig(uiSchema, 'userId')).toBeUndefined();
  });

  it('returns undefined for unknown field path', () => {
    const uiSchema = {};
    expect(getFieldValidationConfig(uiSchema, 'unknown')).toBeUndefined();
  });

  it('works with nested paths', () => {
    const uiSchema = {
      stepOne: {
        userId: {
          'ui:validateOn': 'change',
        },
      },
    };
    expect(getFieldValidationConfig(uiSchema, 'stepOne.userId')).toEqual({
      validateOn: ['change'],
      validateGroup: undefined,
    });
  });
});

describe('getGroupMembers', () => {
  it('finds all members of a group', () => {
    const uiSchema = {
      namespace: {
        'ui:validateOn': 'blur',
        'ui:validateGroup': 'ns-cluster',
      },
      cluster: {
        'ui:validateOn': 'blur',
        'ui:validateGroup': 'ns-cluster',
      },
      userId: {
        'ui:validateOn': 'blur',
      },
    };
    const members = getGroupMembers(uiSchema, 'ns-cluster');
    expect(members).toContain('namespace');
    expect(members).toContain('cluster');
    expect(members).not.toContain('userId');
  });

  it('finds members in nested schema', () => {
    const uiSchema = {
      stepOne: {
        namespace: {
          'ui:validateGroup': 'ns-cluster',
        },
        cluster: {
          'ui:validateGroup': 'ns-cluster',
        },
      },
    };
    const members = getGroupMembers(uiSchema, 'ns-cluster');
    expect(members).toContain('stepOne.namespace');
    expect(members).toContain('stepOne.cluster');
  });

  it('returns empty array when no members found', () => {
    const uiSchema = {
      userId: { 'ui:validateOn': 'blur' },
    };
    expect(getGroupMembers(uiSchema, 'nonexistent')).toEqual([]);
  });
});

describe('areAllGroupFieldsPopulated', () => {
  it('returns true when all members have values', () => {
    const formData = { namespace: 'ns1', cluster: 'cl1' };
    expect(areAllGroupFieldsPopulated(['namespace', 'cluster'], formData)).toBe(
      true,
    );
  });

  it('returns false when a member is empty string', () => {
    const formData = { namespace: 'ns1', cluster: '' };
    expect(areAllGroupFieldsPopulated(['namespace', 'cluster'], formData)).toBe(
      false,
    );
  });

  it('returns false when a member is undefined', () => {
    const formData = { namespace: 'ns1' };
    expect(areAllGroupFieldsPopulated(['namespace', 'cluster'], formData)).toBe(
      false,
    );
  });

  it('returns false when a member is null', () => {
    const formData = { namespace: 'ns1', cluster: null };
    expect(areAllGroupFieldsPopulated(['namespace', 'cluster'], formData)).toBe(
      false,
    );
  });

  it('returns false when a member is an empty array', () => {
    const formData = { namespace: 'ns1', items: [] };
    expect(areAllGroupFieldsPopulated(['namespace', 'items'], formData)).toBe(
      false,
    );
  });

  it('returns true for empty members list', () => {
    expect(areAllGroupFieldsPopulated([], {})).toBe(true);
  });
});
