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
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateThresholds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraOpenIssuesProvider } from './JiraOpenIssuesProvider';
import { JiraClientFactory } from '../clients/JiraClientFactory';
import { JiraClient } from '../clients/base';

jest.mock('../clients/JiraClientFactory');
jest.mock('@red-hat-developer-hub/backstage-plugin-scorecard-node', () => ({
  validateThresholds: jest.fn(),
}));

const mockJiraClient = {
  getCountOpenIssues: jest.fn(),
} as unknown as jest.Mocked<JiraClient>;

const mockConfig = {
  getOptional: jest.fn(),
} as unknown as jest.Mocked<Config>;

const MockedJiraClientFactory = JiraClientFactory as jest.Mocked<
  typeof JiraClientFactory
>;
const mockedValidateThresholds = validateThresholds as jest.MockedFunction<
  typeof validateThresholds
>;

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    annotations: {
      'scorecard.jira/project-key': 'TEST',
    },
  },
  spec: {
    owner: 'guests',
  },
};

const customThresholds: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<5' },
    { key: 'warning', expression: '5-20' },
    { key: 'error', expression: '>20' },
  ],
};

describe('JiraOpenIssuesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedJiraClientFactory.create.mockReturnValue(mockJiraClient);
    mockConfig.getOptional.mockReturnValue(undefined);
  });

  describe('getProviderDatasourceId', () => {
    it('should return "jira"', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);
      expect(provider.getProviderDatasourceId()).toEqual('jira');
    });
  });

  describe('getProviderId', () => {
    it('should return "jira.open_issues"', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);
      expect(provider.getProviderId()).toEqual('jira.open_issues');
    });
  });

  describe('getMetric', () => {
    it('should return correct metric metadata', () => {
      const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);
      expect(provider.getMetric()).toEqual({
        id: 'jira.open_issues',
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of issues that are currently open in Jira.',
        type: 'number',
        history: true,
      });
    });
  });

  describe('getMetricThresholds', () => {
    describe('when no thresholds are configured', () => {
      it('should return default config', () => {
        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);
        expect(provider.getMetricThresholds()).toEqual({
          rules: [
            { key: 'success', expression: '<10' },
            { key: 'warning', expression: '10-50' },
            { key: 'error', expression: '>50' },
          ],
        });
      });
    });

    describe('when thresholds are configured', () => {
      beforeEach(() => {
        mockConfig.getOptional.mockReturnValue(customThresholds);
      });

      it('should return custom config', () => {
        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);
        expect(provider.getMetricThresholds()).toEqual(customThresholds);
      });
    });
  });

  describe('fromConfig', () => {
    describe('when thresholds are not configured', () => {
      it('should create provider with default config', () => {
        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);

        expect(mockConfig.getOptional).toHaveBeenCalledWith(
          'scorecard.plugins.jira.open_issues.thresholds',
        );
        expect(MockedJiraClientFactory.create).toHaveBeenCalledWith(mockConfig);
        expect(mockedValidateThresholds).not.toHaveBeenCalled();
        expect(provider.getMetricThresholds()).toEqual({
          rules: [
            { key: 'success', expression: '<10' },
            { key: 'warning', expression: '10-50' },
            { key: 'error', expression: '>50' },
          ],
        });
      });
    });

    describe('when thresholds are configured', () => {
      it('should create provider with custom config', () => {
        mockConfig.getOptional.mockReturnValue(customThresholds);

        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);

        expect(mockConfig.getOptional).toHaveBeenCalledWith(
          'scorecard.plugins.jira.open_issues.thresholds',
        );
        expect(MockedJiraClientFactory.create).toHaveBeenCalledWith(mockConfig);
        expect(mockedValidateThresholds).toHaveBeenCalledWith(
          customThresholds,
          'number',
        );
        expect(provider.getMetricThresholds()).toEqual(customThresholds);
      });
    });

    describe('when thresholds validation fails', () => {
      const invalidThresholds = {
        rules: [{ key: 'invalid', expression: 'bad' }],
      };

      beforeEach(() => {
        mockConfig.getOptional.mockReturnValue(invalidThresholds);
        mockedValidateThresholds.mockImplementation(() => {
          throw new Error('Invalid thresholds');
        });
      });

      it('should throw an error', () => {
        expect(() => JiraOpenIssuesProvider.fromConfig(mockConfig)).toThrow(
          'Invalid thresholds',
        );
        expect(mockedValidateThresholds).toHaveBeenCalledWith(
          invalidThresholds,
          'number',
        );
      });
    });
  });

  describe('calculateMetric', () => {
    describe('when Jira client processed successfully', () => {
      beforeEach(() => {
        mockJiraClient.getCountOpenIssues.mockResolvedValue(5);
      });

      it('should return the count of open issues', async () => {
        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);

        const result = await provider.calculateMetric(mockEntity);

        expect(result).toBe(5);
        expect(mockJiraClient.getCountOpenIssues).toHaveBeenCalledWith(
          mockEntity,
        );
      });
    });

    describe('when Jira client processed with error', () => {
      beforeEach(() => {
        mockJiraClient.getCountOpenIssues.mockRejectedValue(
          new Error('Jira API error'),
        );
      });

      it('should propagate errors from Jira client', async () => {
        const provider = JiraOpenIssuesProvider.fromConfig(mockConfig);

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
