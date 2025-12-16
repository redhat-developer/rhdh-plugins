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
import { evaluateHiddenCondition } from './evaluateHiddenCondition';

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
});
