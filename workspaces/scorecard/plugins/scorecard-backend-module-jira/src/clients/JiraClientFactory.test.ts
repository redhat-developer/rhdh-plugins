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
import { mockServices } from '@backstage/backend-test-utils';
import { JiraDataCenterClientStrategy } from '../strategies/JiraDataCenterClientStrategy';
import { JiraClientFactory } from './JiraClientFactory';
import { JiraCloudClientStrategy } from '../strategies/JiraCloudClientStrategy';
import { newMockRootConfig } from '../../__fixtures__/testUtils';
import {
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from '../strategies/ConnectionStrategy';

jest.mock('../strategies/JiraDataCenterClientStrategy');
jest.mock('../strategies/JiraCloudClientStrategy');
jest.mock('../strategies/ConnectionStrategy');

const mockedDirectConnectionStrategy =
  DirectConnectionStrategy as unknown as jest.MockedClass<
    typeof DirectConnectionStrategy
  >;
const mockedProxyConnectionStrategy =
  ProxyConnectionStrategy as unknown as jest.MockedClass<
    typeof ProxyConnectionStrategy
  >;

describe('JiraClientFactory', () => {
  let config: Config;
  const factoryOptions = {
    auth: mockServices.auth(),
    discovery: mockServices.discovery(),
    logger: mockServices.logger.mock(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fromConfig', () => {
    it('should use proxy connection strategy when proxyPath exists', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'cloud', proxyPath: '/jira/api' },
      });

      JiraClientFactory.fromConfig(config, factoryOptions);
      expect(mockedProxyConnectionStrategy).toHaveBeenCalledWith(
        '/jira/api',
        factoryOptions.auth,
        factoryOptions.discovery,
      );
      expect(mockedDirectConnectionStrategy).not.toHaveBeenCalled();
    });

    it('should use direct connection strategy when proxyPath is not configured', () => {
      config = newMockRootConfig({
        jiraConfig: {
          baseUrl: 'https://example.atlassian.net',
          token: 'token',
          product: 'cloud',
          proxyPath: undefined,
        },
      });

      JiraClientFactory.fromConfig(config, factoryOptions);
      expect(mockedDirectConnectionStrategy).toHaveBeenCalledWith(
        'https://example.atlassian.net',
        'token',
        'cloud',
      );
      expect(mockedProxyConnectionStrategy).not.toHaveBeenCalled();
    });

    it('should create datacenter client when product is datacenter with direct strategy', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'datacenter', proxyPath: undefined },
      });

      const client = JiraClientFactory.fromConfig(config, factoryOptions);
      expect(client).toBeInstanceOf(JiraDataCenterClientStrategy);
      expect(mockedDirectConnectionStrategy).toHaveBeenCalledWith(
        'https://example.com/api',
        'dummyToken',
        'datacenter',
      );
      expect(JiraDataCenterClientStrategy).toHaveBeenCalledWith(
        mockedDirectConnectionStrategy.mock.instances[0],
        factoryOptions.logger,
      );
    });

    it('should create datacenter client when product is datacenter with proxy strategy', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'datacenter', proxyPath: '/jira/api' },
      });

      const client = JiraClientFactory.fromConfig(config, factoryOptions);
      expect(client).toBeInstanceOf(JiraDataCenterClientStrategy);
      expect(mockedProxyConnectionStrategy).toHaveBeenCalledWith(
        '/jira/api',
        factoryOptions.auth,
        factoryOptions.discovery,
      );
      expect(JiraDataCenterClientStrategy).toHaveBeenCalledWith(
        mockedProxyConnectionStrategy.mock.instances[0],
        factoryOptions.logger,
      );
    });

    it('should create cloud client when product is cloud with direct strategy', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'cloud', proxyPath: undefined },
      });

      const client = JiraClientFactory.fromConfig(config, factoryOptions);

      expect(client).toBeInstanceOf(JiraCloudClientStrategy);
      expect(mockedDirectConnectionStrategy).toHaveBeenCalledWith(
        'https://example.com/api',
        'dummyToken',
        'cloud',
      );
      expect(JiraCloudClientStrategy).toHaveBeenCalledWith(
        mockedDirectConnectionStrategy.mock.instances[0],
        factoryOptions.logger,
      );
    });

    it('should create cloud client when product is cloud with proxy strategy', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'cloud', proxyPath: '/jira/api' },
      });

      const client = JiraClientFactory.fromConfig(config, factoryOptions);

      expect(client).toBeInstanceOf(JiraCloudClientStrategy);
      expect(mockedProxyConnectionStrategy).toHaveBeenCalledWith(
        '/jira/api',
        factoryOptions.auth,
        factoryOptions.discovery,
      );
      expect(JiraCloudClientStrategy).toHaveBeenCalledWith(
        mockedProxyConnectionStrategy.mock.instances[0],
        factoryOptions.logger,
      );
    });

    it('should throw when product is invalid', () => {
      config = newMockRootConfig({
        jiraConfig: { product: 'foo', proxyPath: undefined },
      });

      expect(() =>
        JiraClientFactory.fromConfig(config, factoryOptions),
      ).toThrow(
        "Invalid Jira product: foo. Valid products for 'jira.product' are: datacenter, cloud",
      );
    });
  });
});
