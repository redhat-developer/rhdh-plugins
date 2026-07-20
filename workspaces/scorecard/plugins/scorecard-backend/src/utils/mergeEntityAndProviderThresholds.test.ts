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

import type { Entity } from '@backstage/catalog-model';
import {
  MockNumberProvider,
  MockBooleanProvider,
} from '../../__fixtures__/mockProviders';
import { mergeEntityAndProviderThresholds } from '../utils/mergeEntityAndProviderThresholds';
import { ThresholdConfigFormatError } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const numberMetricThresholds = {
  rules: [
    { key: 'error', expression: '>40' },
    { key: 'warning', expression: '>20' },
    { key: 'success', expression: '<=20' },
  ],
};

const booleanMetricThresholds = {
  rules: [
    { key: 'success', expression: '==true' },
    { key: 'error', expression: '==false' },
  ],
};

describe('mergeEntityAndProviderThresholds', () => {
  let entity: Entity;

  const numberMetricProvider = new MockNumberProvider(
    'github.important_metric',
    'github',
  );
  const booleanMetricProvider = new MockBooleanProvider(
    'jira.boolean_metric',
    'jira',
  );

  const numberMetric = numberMetricProvider.getMetrics()[0];
  const booleanMetric = booleanMetricProvider.getMetrics()[0];

  beforeEach(() => {
    entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-component',
        namespace: 'default',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when entity has no threshold overrides', () => {
    it('should return metric thresholds unchanged for number metric', () => {
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual(numberMetricThresholds);
    });

    it('should return metric thresholds unchanged for boolean metric', () => {
      const result = mergeEntityAndProviderThresholds(
        entity,
        booleanMetric,
        booleanMetricProvider.getProviderId(),
      );
      expect(result).toEqual(booleanMetricThresholds);
    });

    it('should handle entity with empty annotations', () => {
      entity.metadata.annotations = {};
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );
      expect(result).toEqual(numberMetricThresholds);
    });

    it('should handle entity with no metadata', () => {
      entity.metadata = { name: 'test-component' };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );
      expect(result).toEqual(numberMetricThresholds);
    });
  });

  describe('when entity has valid threshold overrides', () => {
    it('should override single metric threshold rule for number metric', () => {
      entity.metadata.annotations = {
        'scorecard.io/github.important_metric.thresholds.rules.error': '>50',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual({
        rules: [
          { key: 'error', expression: '>50' },
          { key: 'warning', expression: '>20' },
          { key: 'success', expression: '<=20' },
        ],
      });
    });

    it('should override multiple metric threshold rules for number metric', () => {
      entity.metadata.annotations = {
        'scorecard.io/github.important_metric.thresholds.rules.error': '>50',
        'scorecard.io/github.important_metric.thresholds.rules.warning': '>30',
        'scorecard.io/github.important_metric.thresholds.rules.success': '<=30',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual({
        rules: [
          { key: 'error', expression: '>50' },
          { key: 'warning', expression: '>30' },
          { key: 'success', expression: '<=30' },
        ],
      });
    });

    it('should override metric threshold rule for boolean metric', () => {
      entity.metadata.annotations = {
        'scorecard.io/jira.boolean_metric.thresholds.rules.success': '!=false',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        booleanMetric,
        booleanMetricProvider.getProviderId(),
      );

      expect(result).toEqual({
        rules: [
          { key: 'success', expression: '!=false' },
          { key: 'error', expression: '==false' },
        ],
      });
    });

    it('should ignore annotations with empty expression values', () => {
      entity.metadata.annotations = {
        'scorecard.io/github.important_metric.thresholds.rules.error': '',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual(numberMetricThresholds);
    });

    it('should ignore annotations that do not match the provider prefix', () => {
      entity.metadata.annotations = {
        'scorecard.io/other.provider.thresholds.rules.error': '>50',
        'scorecard.io/github.important_metric.thresholds.rules.warning': '>30',
        'scorecard.io/github.important_metric.thresholds.rules.success': '<=30',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual({
        rules: [
          { key: 'error', expression: '>40' },
          { key: 'warning', expression: '>30' },
          { key: 'success', expression: '<=30' },
        ],
      });
    });

    it('should handle range expressions in overrides', () => {
      entity.metadata.annotations = {
        'scorecard.io/github.important_metric.thresholds.rules.error': '>100',
        'scorecard.io/github.important_metric.thresholds.rules.warning':
          '0-100',
        'scorecard.io/github.important_metric.thresholds.rules.success': '<0',
      };
      const result = mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      );

      expect(result).toEqual({
        rules: [
          { key: 'error', expression: '>100' },
          { key: 'warning', expression: '0-100' },
          { key: 'success', expression: '<0' },
        ],
      });
    });

    it('should preserve color from metric rules when overriding', () => {
      const customMetric: Metric<'number'> = {
        id: 'github.custom_metric',
        title: 'Custom Metric',
        description: 'Custom metric description.',
        type: 'number',
        thresholds: {
          rules: [
            { key: 'low', expression: '<10', color: 'success.main' },
            {
              key: 'high',
              expression: '10-20',
              color: '#FF0000',
              icon: 'scorecardWarningStatusIcon',
            },
            { key: 'error', expression: '>20' },
          ],
        },
      };

      entity.metadata.annotations = {
        'scorecard.io/github.custom_metric.thresholds.rules.high': '10-60',
        'scorecard.io/github.custom_metric.thresholds.rules.error': '>60',
      };

      const result = mergeEntityAndProviderThresholds(
        entity,
        customMetric,
        'github.custom_metric',
      );

      expect(result).toEqual({
        rules: [
          { key: 'low', expression: '<10', color: 'success.main' },
          {
            key: 'high',
            expression: '10-60',
            color: '#FF0000',
            icon: 'scorecardWarningStatusIcon',
          },
          { key: 'error', expression: '>60' },
        ],
      });
    });

    it('should throw when merged annotation rules leave a gap on the real line', () => {
      const partitionMetric: Metric<'number'> = {
        id: 'github.partition_metric',
        title: 'Partition Metric',
        description: 'Test',
        type: 'number',
        thresholds: {
          rules: [
            { key: 'success', expression: '<10' },
            { key: 'warning', expression: '10-20' },
            { key: 'error', expression: '>20' },
          ],
        },
      };

      entity.metadata.annotations = {
        'scorecard.io/github.partition_metric.thresholds.rules.warning':
          '11-20',
      };

      expect(() =>
        mergeEntityAndProviderThresholds(
          entity,
          partitionMetric,
          'github.partition_metric',
        ),
      ).toThrow(ThresholdConfigFormatError);
      expect(() =>
        mergeEntityAndProviderThresholds(
          entity,
          partitionMetric,
          'github.partition_metric',
        ),
      ).toThrow(/do not cover the entire real line/);
    });
  });

  it('should throw error for invalid threshold expression', () => {
    entity.metadata.annotations = {
      'scorecard.io/github.important_metric.thresholds.rules.error': 'invalid',
    };
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      ),
    ).toThrow(ThresholdConfigFormatError);
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        numberMetric,
        numberMetricProvider.getProviderId(),
      ),
    ).toThrow(
      "Invalid threshold annotation 'scorecard.io/github.important_metric.thresholds.rules.error: invalid' in entity 'component:default/test-component'",
    );
  });

  it('should throw ThresholdConfigFormatError with annotation path when boolean override expression is invalid', () => {
    entity.metadata.annotations = {
      'scorecard.io/jira.boolean_metric.thresholds.rules.success': '>40',
    };
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        booleanMetric,
        booleanMetricProvider.getProviderId(),
      ),
    ).toThrow(ThresholdConfigFormatError);
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        booleanMetric,
        booleanMetricProvider.getProviderId(),
      ),
    ).toThrow(
      "Invalid threshold annotation 'scorecard.io/jira.boolean_metric.thresholds.rules.success: >40' in entity 'component:default/test-component'",
    );
  });

  it('should preserve order of metric rules when overriding', () => {
    entity.metadata.annotations = {
      'scorecard.io/github.important_metric.thresholds.rules.success': '<=20',
      'scorecard.io/github.important_metric.thresholds.rules.error': '>50',
    };
    const result = mergeEntityAndProviderThresholds(
      entity,
      numberMetric,
      numberMetricProvider.getProviderId(),
    );

    expect(result.rules[0]).toEqual({ key: 'error', expression: '>50' });
    expect(result.rules[1]).toEqual({ key: 'warning', expression: '>20' });
    expect(result.rules[2]).toEqual({ key: 'success', expression: '<=20' });
  });

  it('should throw error when entity has invalid threshold key', () => {
    const singleRuleMetric: Metric<'number'> = {
      id: 'github.important_metric',
      title: 'Mock Number Metric',
      description: 'Mock number description.',
      type: 'number',
      thresholds: {
        rules: [{ key: 'error', expression: '>40' }],
      },
    };

    entity.metadata.annotations = {
      'scorecard.io/github.important_metric.thresholds.rules.success': '<=10',
    };
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        singleRuleMetric,
        'github.important_metric',
      ),
    ).toThrow(ThresholdConfigFormatError);
    expect(() =>
      mergeEntityAndProviderThresholds(
        entity,
        singleRuleMetric,
        'github.important_metric',
      ),
    ).toThrow(
      'Unable to override component:default/test-component thresholds by {"key":"success","expression":"<=10"}, metric provider github.important_metric does not support key success',
    );
  });
});
