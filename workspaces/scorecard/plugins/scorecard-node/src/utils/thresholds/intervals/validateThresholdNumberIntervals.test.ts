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

import type { ThresholdRule } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '../../../errors';
import { validateThresholdNumberIntervals } from './validateThresholdNumberIntervals';

const coverageError =
  /do not cover the entire real line|First uncovered region/;

describe('validateThresholdNumberIntervals', () => {
  describe('skipped when not applicable', () => {
    it('should not throw for empty rules', () => {
      expect(() =>
        validateThresholdNumberIntervals([], 'number'),
      ).not.toThrow();
    });

    it('should not throw for non-number metric type', () => {
      const rules: ThresholdRule[] = [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'boolean'),
      ).not.toThrow();
    });

    it('should not throw when all rules are discrete number equals', () => {
      const rules: ThresholdRule[] = [
        { key: 'A', expression: '==1', color: '#111', icon: 'a' },
        { key: 'B', expression: '==2', color: '#222', icon: 'b' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });
  });

  describe('validates full coverage', () => {
    it('should accept a classic three-band partition', () => {
      const rules: ThresholdRule[] = [
        { key: 'success', expression: '<10' },
        { key: 'warning', expression: '10-20' },
        { key: 'error', expression: '>20' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });

    it('should accept aggregation-style ordering with overlapping unions covering the real line', () => {
      const rules: ThresholdRule[] = [
        { key: 'success', expression: '>=75', color: 'success.main' },
        { key: 'warning', expression: '10-75', color: 'warning.main' },
        { key: 'error', expression: '<10', color: 'error.main' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });

    it('should accept rules that include != when the union still covers the real line', () => {
      const rules: ThresholdRule[] = [
        { key: 'low', expression: '<10' },
        { key: 'mid', expression: '10-20' },
        { key: 'high', expression: '>20' },
        { key: 'punct', expression: '!=15', color: '#333', icon: 'x' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });
  });

  describe('accepts overlapping intervals', () => {
    it('should accept redundant overlapping rules when the union still covers the real line', () => {
      const rules: ThresholdRule[] = [
        { key: 'low', expression: '<50' },
        { key: 'mid', expression: '0-100' },
        { key: 'high', expression: '>40' },
      ];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });
  });

  describe('rejects gaps', () => {
    it('should throw error when an internal gap between rules is detected', () => {
      const rules: ThresholdRule[] = [
        { key: 'success', expression: '<10' },
        { key: 'warning', expression: '11-20' },
        { key: 'error', expression: '>20' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        ThresholdConfigFormatError,
      );
      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });

    it('should throw error when a single-point gap between strict comparisons is detected', () => {
      const rules: ThresholdRule[] = [
        { key: 'low', expression: '<10' },
        { key: 'high', expression: '>10' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });

    it('should throw error when unions omit tails outside disjoint bounded bands', () => {
      const rules: ThresholdRule[] = [
        { key: 'lowBand', expression: '10-20' },
        { key: 'highBand', expression: '30-40' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });

    it('should throw error when an open gap toward +∞ is detected (needs at least two rules to evaluate coverage)', () => {
      const rules: ThresholdRule[] = [
        { key: 'left', expression: '<100' },
        { key: 'right', expression: '>=200' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });

    it('should throw error when an open gap toward -∞ is detected (needs at least two rules to evaluate coverage)', () => {
      const rules: ThresholdRule[] = [
        { key: 'left', expression: '<=100' },
        { key: 'right', expression: '>=200' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });
  });

  describe('skips coverage check when applicable', () => {
    it('should not throw when there is only one number rule', () => {
      const rules: ThresholdRule[] = [{ key: 'success', expression: '<10' }];

      expect(() =>
        validateThresholdNumberIntervals(rules, 'number'),
      ).not.toThrow();
    });

    it('should throw error when mixing == with continuous rules without full coverage', () => {
      const rules: ThresholdRule[] = [
        { key: 'eq', expression: '==5', color: '#111', icon: 'i' },
        { key: 'rest', expression: '>10' },
      ];

      expect(() => validateThresholdNumberIntervals(rules, 'number')).toThrow(
        coverageError,
      );
    });
  });
});
