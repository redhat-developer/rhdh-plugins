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

import { JsonObject } from '@backstage/types';

import {
  HiddenCondition,
  HiddenConditionObject,
} from '../types/HiddenCondition';
import {
  evaluateHiddenCondition,
  getValueForWhen,
} from './evaluateHiddenCondition';

describe('evaluateHiddenCondition', () => {
  describe('boolean conditions', () => {
    it('should return true for static true', () => {
      expect(evaluateHiddenCondition(true, {})).toBe(true);
    });

    it('should return false for static false', () => {
      expect(evaluateHiddenCondition(false, {})).toBe(false);
    });
  });

  describe('simple conditions', () => {
    const formData: JsonObject = {
      deploymentType: 'advanced',
      environment: 'production',
      name: '',
      tags: [],
      count: 5,
    };

    it('should hide when field equals value (is)', () => {
      const condition: HiddenConditionObject = {
        when: 'deploymentType',
        is: 'advanced',
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should not hide when field does not equal value (is)', () => {
      const condition: HiddenConditionObject = {
        when: 'deploymentType',
        is: 'simple',
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(false);
    });

    it('should hide when field equals any value in array (is)', () => {
      const condition: HiddenConditionObject = {
        when: 'deploymentType',
        is: ['simple', 'advanced', 'custom'],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should hide when field not in array (isNot)', () => {
      const condition: HiddenConditionObject = {
        when: 'deploymentType',
        isNot: ['simple', 'managed'],
      };
      // deploymentType is 'advanced', which is NOT in ['simple', 'managed'], so it should hide
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should hide when field not equals value (isNot)', () => {
      const condition: HiddenConditionObject = {
        when: 'environment',
        isNot: 'development',
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should hide when field is empty string (isEmpty)', () => {
      const condition: HiddenConditionObject = {
        when: 'name',
        isEmpty: true,
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should hide when field is empty array (isEmpty)', () => {
      const condition: HiddenConditionObject = {
        when: 'tags',
        isEmpty: true,
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should not hide when field has value (isEmpty)', () => {
      const condition: HiddenConditionObject = {
        when: 'count',
        isEmpty: true,
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(false);
    });

    it('should handle nested field paths', () => {
      const nestedFormData: JsonObject = {
        config: {
          server: {
            port: 8080,
          },
        },
      };
      const condition: HiddenConditionObject = {
        when: 'config.server.port',
        is: 8080,
      };
      expect(evaluateHiddenCondition(condition, nestedFormData)).toBe(true);
    });

    it('should hide when list is non-empty (isNotEmptyList)', () => {
      const condition: HiddenConditionObject = {
        when: 'items',
        isNotEmptyList: true,
      };
      expect(
        evaluateHiddenCondition(condition, {
          items: ['a'],
        }),
      ).toBe(true);
      expect(
        evaluateHiddenCondition(condition, {
          items: [],
        }),
      ).toBe(false);
    });

    it('should hide when list does not contain value (notContains)', () => {
      const condition: HiddenConditionObject = {
        when: 'items',
        notContains: 'x',
      };
      expect(
        evaluateHiddenCondition(condition, {
          items: ['a', 'b'],
        }),
      ).toBe(true);
      expect(
        evaluateHiddenCondition(condition, {
          items: ['a', 'x'],
        }),
      ).toBe(false);
      expect(
        evaluateHiddenCondition(condition, {
          items: 'not-a-list',
        }),
      ).toBe(false);
    });

    it('should AND multiple operators in one condition object', () => {
      const condition: HiddenConditionObject = {
        when: 'items',
        isNotEmptyList: true,
        notContains: 'x',
      };

      expect(
        evaluateHiddenCondition(condition, {
          items: ['a', 'b'],
        }),
      ).toBe(true);
      expect(
        evaluateHiddenCondition(condition, {
          items: [],
        }),
      ).toBe(false);
      expect(
        evaluateHiddenCondition(condition, {
          items: ['x'],
        }),
      ).toBe(false);
    });
  });

  describe('composite conditions', () => {
    const formData: JsonObject = {
      deploymentType: 'custom',
      environment: 'production',
      enableFeature: true,
    };

    it('should handle allOf (AND logic) - all true', () => {
      const condition: HiddenCondition = {
        allOf: [
          { when: 'deploymentType', is: 'custom' },
          { when: 'environment', is: 'production' },
        ],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should handle allOf (AND logic) - one false', () => {
      const condition: HiddenCondition = {
        allOf: [
          { when: 'deploymentType', is: 'custom' },
          { when: 'environment', is: 'development' },
        ],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(false);
    });

    it('should handle anyOf (OR logic) - one true', () => {
      const condition: HiddenCondition = {
        anyOf: [
          { when: 'deploymentType', is: 'simple' },
          { when: 'environment', is: 'production' },
        ],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });

    it('should handle anyOf (OR logic) - all false', () => {
      const condition: HiddenCondition = {
        anyOf: [
          { when: 'deploymentType', is: 'simple' },
          { when: 'environment', is: 'development' },
        ],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(false);
    });

    it('should handle nested composite conditions', () => {
      const condition: HiddenCondition = {
        allOf: [
          { when: 'enableFeature', is: true },
          {
            anyOf: [
              { when: 'deploymentType', is: 'custom' },
              { when: 'environment', is: 'staging' },
            ],
          },
        ],
      };
      expect(evaluateHiddenCondition(condition, formData)).toBe(true);
    });
  });

  describe('scoped form data (wizard step / object siblings)', () => {
    const rootFormData: JsonObject = {
      inputs: {
        field1: 'show',
        field2: 'ready',
        conditionalDetail: 'value',
      },
      step2: {
        other: 'x',
      },
    };

    const stepLocalData = rootFormData.inputs as JsonObject;

    it('getValueForWhen resolves sibling fields from local object data', () => {
      expect(getValueForWhen('field1', stepLocalData, rootFormData)).toBe(
        'show',
      );
      expect(getValueForWhen('field1', rootFormData)).toBeUndefined();
    });

    it('shows field3 when field1 is show and field2 is ready (local scope)', () => {
      const condition: HiddenCondition = {
        anyOf: [
          { when: 'field1', isNot: 'show' },
          { when: 'field2', isNot: 'ready' },
        ],
      };
      expect(
        evaluateHiddenCondition(condition, stepLocalData, rootFormData),
      ).toBe(false);
      expect(evaluateHiddenCondition(condition, rootFormData)).toBe(true);
    });

    it('hides field3 when field1 is hide or field2 is idle', () => {
      const condition: HiddenCondition = {
        anyOf: [
          { when: 'field1', isNot: 'show' },
          { when: 'field2', isNot: 'ready' },
        ],
      };
      expect(
        evaluateHiddenCondition(
          condition,
          { field1: 'hide', field2: 'ready' },
          rootFormData,
        ),
      ).toBe(true);
      expect(
        evaluateHiddenCondition(
          condition,
          { field1: 'show', field2: 'idle' },
          rootFormData,
        ),
      ).toBe(true);
    });
  });
});
