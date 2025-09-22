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

import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateThresholds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraOpenIssuesProvider } from './JiraOpenIssuesProvider';
import { JiraClientFactory } from '../clients/JiraClientFactory';
import { JiraClient } from '../clients/base';
import { mockServices } from '@backstage/backend-test-utils';
import {
  newEntityComponent,
  newThresholdsConfig,
  newMockRootConfig,
} from '../../__fixtures__/testUtils';
import { ScorecardJiraAnnotations } from '../annotations';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

jest.mock('../clients/JiraClientFactory');
jest.mock('@red-hat-developer-hub/backstage-plugin-scorecard-node', () => ({
  validateThresholds: jest.fn(),
}));

const mockJiraClient = {
  getCountOpenIssues: jest.fn(),
} as unknown as jest.Mocked<JiraClient>;

const MockedJiraClientFactory = JiraClientFactory as jest.Mocked<
  typeof JiraClientFactory
>;
const mockedValidateThresholds = validateThresholds as jest.MockedFunction<
  typeof validateThresholds
>;

const mockEntity: Entity = newEntityComponent({
  [PROJECT_KEY]: 'TEST',
});

const customThresholds: ThresholdConfig = newThresholdsConfig();
const mockDiscovery = mockServices.discovery();
const mockAuth = mockServices.auth();

describe('JiraOpenIssuesProvider', () => {
  let mockConfig: Config;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedJiraClientFactory.create.mockReturnValue(mockJiraClient);
    mockConfig = mockServices.rootConfig({ data: {} });
  });

  describe('getProviderDatasourceId', () => {
    it('should return "jira"', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.getProviderDatasourceId()).toEqual('jira');
    });
  });

  describe('getProviderId', () => {
    it('should return "jira.open-issues"', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.getProviderId()).toEqual('jira.open-issues');
    });
  });

  describe('getMetric', () => {
    let getMetricResult: Metric<'number'>;

    beforeEach(() => {
      jest.spyOn(JiraOpenIssuesProvider.prototype, 'getProviderId');

      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      getMetricResult = provider.getMetric();
    });

    it('should return correct metric metadata', () => {
      expect(getMetricResult).toEqual({
        id: 'jira.open-issues',
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of issues that are currently open in Jira.',
        type: 'number',
        history: true,
      });
    });

    it('should call getProviderId', () => {
      expect(JiraOpenIssuesProvider.prototype.getProviderId).toHaveBeenCalled();
    });
  });

  describe('getMetricThresholds', () => {
    it('should return default config when no thresholds are configured', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.getMetricThresholds()).toEqual(DEFAULT_NUMBER_THRESHOLDS);
    });

    it('should return custom config when thresholds are configured', () => {
      const config = newMockRootConfig({ thresholds: customThresholds });

      const provider = JiraOpenIssuesProvider.fromConfig(
        config,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.getMetricThresholds()).toEqual(customThresholds);
    });
  });

  describe('supportsEntity', () => {
    it('should return true when entity has project key annotation', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.supportsEntity(mockEntity)).toBe(true);
    });

    it('should return false when entity does not have project key annotation', () => {
      const mockEmptyEntity: Entity = newEntityComponent({});

      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(provider.supportsEntity(mockEmptyEntity)).toBe(false);
    });
  });

  describe('fromConfig', () => {
    it('should create provider with default config when thresholds are not configured', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );

      expect(MockedJiraClientFactory.create).toHaveBeenCalledWith(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      expect(mockedValidateThresholds).not.toHaveBeenCalled();
      expect(provider.getMetricThresholds()).toEqual(DEFAULT_NUMBER_THRESHOLDS);
    });

    it('should create provider with custom config when thresholds are configured', () => {
      const config = newMockRootConfig({ thresholds: customThresholds });

      const provider = JiraOpenIssuesProvider.fromConfig(
        config,
        mockDiscovery,
        mockAuth,
      );

      expect(MockedJiraClientFactory.create).toHaveBeenCalledWith(
        config,
        mockDiscovery,
        mockAuth,
      );
      expect(mockedValidateThresholds).toHaveBeenCalledWith(
        customThresholds,
        'number',
      );
      expect(provider.getMetricThresholds()).toEqual(customThresholds);
    });

    it('should throw an error when invalid thresholds are configured', () => {
      const invalidThresholds = {
        rules: [{ key: 'invalid', expression: 'bad' }],
      };
      mockedValidateThresholds.mockImplementation(() => {
        throw new Error('Invalid thresholds');
      });
      const config = newMockRootConfig({ thresholds: invalidThresholds });

      expect(() =>
        JiraOpenIssuesProvider.fromConfig(config, mockDiscovery, mockAuth),
      ).toThrow('Invalid thresholds');
      expect(mockedValidateThresholds).toHaveBeenCalledWith(
        invalidThresholds,
        'number',
      );
    });
  });

  describe('calculateMetric', () => {
    it('should return the count of open issues when Jira client processed successfully', async () => {
      mockJiraClient.getCountOpenIssues.mockResolvedValue(5);

      const provider = JiraOpenIssuesProvider.fromConfig(
        mockConfig,
        mockDiscovery,
        mockAuth,
      );
      const result = await provider.calculateMetric(mockEntity);

      expect(result).toBe(5);
      expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
        mockEntity,
      );
    });

    describe('when Jira client processed with error', () => {
      beforeEach(() => {
        mockJiraClient.getCountOpenIssues.mockRejectedValue(
          new Error('Jira API error'),
        );
      });

      it('should propagate errors from Jira client', async () => {
        const provider = JiraOpenIssuesProvider.fromConfig(
          mockConfig,
          mockDiscovery,
          mockAuth,
        );
        await expect(provider.calculateMetric(mockEntity)).rejects.toThrow(
          'Jira API error',
        );
        expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
          mockEntity,
        );
      });
    });
  });
});
