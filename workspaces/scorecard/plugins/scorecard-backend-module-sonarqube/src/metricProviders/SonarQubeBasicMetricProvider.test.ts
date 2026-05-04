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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import { SonarQubeBasicMetricProvider } from './SonarQubeBasicMetricProvider';
import {
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_NUMBER_METRICS,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
  SonarQubeMetricId,
} from './SonarQubeConfig';
import { mockServices } from '@backstage/backend-test-utils';

jest.mock('../clients/SonarQubeClient');

const mockLogger = mockServices.logger.mock();

const emptyThresholds: ThresholdConfig = { rules: [] };

class TestBooleanBasic extends SonarQubeBasicMetricProvider<'boolean'> {
  constructor(
    client: SonarQubeClient,
    metricId: 'quality_gate',
    thresholds: ThresholdConfig,
  ) {
    super(client, metricId, thresholds, 'boolean');
  }
}

class TestNumberBasic extends SonarQubeBasicMetricProvider<'number'> {
  constructor(
    client: SonarQubeClient,
    metricId: (typeof SONARQUBE_NUMBER_METRICS)[number],
    thresholds: ThresholdConfig,
  ) {
    super(client, metricId, thresholds, 'number');
  }
}

const providers = [
  {
    provider: new TestBooleanBasic(
      makeClient(),
      'quality_gate',
      emptyThresholds,
    ),
    metricId: 'quality_gate',
    type: 'boolean',
  },
  {
    provider: new TestNumberBasic(makeClient(), 'open_issues', emptyThresholds),
    metricId: 'open_issues',
    type: 'number',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  const { SonarQubeClient: MockClient } = jest.requireMock(
    '../clients/SonarQubeClient',
  );
  MockClient.mockImplementation(() => ({}));
});

function makeClient(): SonarQubeClient {
  return new SonarQubeClient(new ConfigReader({}), mockLogger);
}

describe('SonarQubeBasicMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it.each(providers)(
      'should return sonarqube datasource id for $type metric type',
      ({ provider }) => {
        expect(provider.getProviderDatasourceId()).toBe('sonarqube');
      },
    );
  });

  describe('getProviderId', () => {
    it.each(providers)(
      'should return the provider id from SONARQUBE_METRIC_CONFIG for $type metric type',
      ({ provider, metricId }) => {
        const meta = SONARQUBE_METRIC_CONFIG[metricId as SonarQubeMetricId];
        expect(provider.getProviderId()).toBe(meta.id);
      },
    );
  });

  describe('getMetricType', () => {
    it.each(providers)(
      'should return the metric type given at construction for $type metric type',
      ({ provider, type }) => {
        expect(provider.getMetricType()).toBe(type);
      },
    );
  });

  describe('getMetricThresholds', () => {
    it.each(providers)(
      'should return the thresholds from the constructor for $type metric type',
      ({ provider }) => {
        expect(provider.getMetricThresholds()).toBe(emptyThresholds);
      },
    );
  });

  describe('getCatalogFilter', () => {
    it.each(providers)(
      'should get the catalog filter for $type metric type',
      ({ provider }) => {
        expect(provider.getCatalogFilter()).toEqual({
          [`metadata.annotations.${SONARQUBE_PROJECT_KEY_ANNOTATION}`]:
            CATALOG_FILTER_EXISTS,
        });
      },
    );
  });
});
