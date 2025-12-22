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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { type Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { OpenSSFClient } from '../clients/OpenSSFClient';
import { OpenSSFResponse } from '../clients/types';
import { AbstractMetricProvider } from './AbstractMetricProvider';

// Mock the OpenSSFClient module
jest.mock('../clients/OpenSSFClient');

// Concrete implementation for testing the abstract class
class TestMetricProvider extends AbstractMetricProvider {
  getMetricName(): string {
    return 'Test-Metric';
  }

  getMetricDisplayTitle(): string {
    return 'Test Metric Title';
  }

  getMetricDescription(): string {
    return 'Test metric description';
  }
}

describe('AbstractMetricProvider', () => {
  let provider: TestMetricProvider;
  let mockGetScorecard: jest.Mock;

  const mockOpenSSFResponse: OpenSSFResponse = {
    date: '2024-01-15',
    repo: {
      name: 'github.com/owner/test',
      commit: 'abc123',
    },
    scorecard: {
      version: '4.0.0',
      commit: 'def456',
    },
    score: 7.5,
    checks: [
      {
        name: 'Test-Metric',
        score: 8,
        reason: 'Test reason',
        details: null,
        documentation: {
          short: 'Short doc',
          url: 'https://example.com',
        },
      },
      {
        name: 'Other-Metric',
        score: 6,
        reason: 'Other reason',
        details: null,
        documentation: {
          short: 'Other doc',
          url: 'https://example.com/other',
        },
      },
    ],
  };

  const createMockEntity = (projectSlug?: string): Entity => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      annotations: projectSlug ? { 'openssf/project': projectSlug } : undefined,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock for OpenSSFClient
    mockGetScorecard = jest.fn().mockResolvedValue(mockOpenSSFResponse);
    (OpenSSFClient as jest.Mock).mockImplementation(() => ({
      getScorecard: mockGetScorecard,
    }));

    provider = new TestMetricProvider();
  });

  describe('getProviderDatasourceId', () => {
    it('should return "openssf"', () => {
      expect(provider.getProviderDatasourceId()).toBe('openssf');
    });
  });

  describe('getProviderId', () => {
    it('should return normalized provider ID with openssf prefix', () => {
      expect(provider.getProviderId()).toBe('openssf.test_metric');
    });

    it('should convert hyphens to underscores and lowercase', () => {
      // The metric name is "Test-Metric", should become "test_metric"
      expect(provider.getProviderId()).toBe('openssf.test_metric');
    });
  });

  describe('getMetricType', () => {
    it('should return "number"', () => {
      expect(provider.getMetricType()).toBe('number');
    });
  });

  describe('getMetric', () => {
    it('should return metric object with correct properties', () => {
      const metric = provider.getMetric();

      expect(metric).toEqual({
        id: 'openssf.test_metric',
        title: 'Test Metric Title',
        description: 'Test metric description',
        type: 'number',
        history: true,
      });
    });
  });

  describe('getMetricThresholds', () => {
    it('should return default thresholds when none provided', () => {
      expect(provider.getMetricThresholds()).toEqual(DEFAULT_NUMBER_THRESHOLDS);
    });

    it('should return custom thresholds when provided', () => {
      const customThresholds: ThresholdConfig = {
        rules: [
          { key: 'success', expression: '>9' },
          { key: 'warning', expression: '7-9' },
          { key: 'error', expression: '<7' },
        ],
      };
      const customProvider = new TestMetricProvider(customThresholds);

      expect(customProvider.getMetricThresholds()).toEqual(customThresholds);
    });
  });

  describe('getCatalogFilter', () => {
    it('should return filter for openssf/project-slug annotation', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.openssf/project': CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetric', () => {
    it('should call OpenSSFClient with owner and repo from entity', async () => {
      const entity = createMockEntity('owner/test');

      await provider.calculateMetric(entity);

      expect(mockGetScorecard).toHaveBeenCalledWith('owner', 'test');
    });

    it('should return the score for the matching metric', async () => {
      const entity = createMockEntity('owner/test');

      const score = await provider.calculateMetric(entity);

      // provider has getMetricName() returning 'Test-Metric', so score should be 8
      expect(score).toBe(8);
    });

    it('should throw error when metric is not found in scorecard', async () => {
      const responseWithoutMetric: OpenSSFResponse = {
        ...mockOpenSSFResponse,
        checks: [
          {
            name: 'Different-Metric',
            score: 5,
            reason: 'Different reason',
            details: null,
            documentation: {
              short: 'Different doc',
              url: 'https://example.com/different',
            },
          },
        ],
      };
      mockGetScorecard.mockResolvedValue(responseWithoutMetric);

      const entity = createMockEntity('owner/test');

      await expect(provider.calculateMetric(entity)).rejects.toThrow(
        "OpenSSF check 'Test-Metric' not found in scorecard for owner/test",
      );
    });

    it('should throw error when entity is missing openssf/project annotation', async () => {
      const entity = createMockEntity();

      await expect(provider.calculateMetric(entity)).rejects.toThrow(
        "Missing annotation 'openssf/project'",
      );
    });

    it('should throw error when project slug has invalid format', async () => {
      const entity = createMockEntity('invalid-slug-without-slash');

      await expect(provider.calculateMetric(entity)).rejects.toThrow(
        "Invalid format of 'openssf/project'",
      );
    });
  });
});
