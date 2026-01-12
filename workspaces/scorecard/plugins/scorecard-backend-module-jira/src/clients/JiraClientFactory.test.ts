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
import { JiraDataCenterClientStrategy } from '../strategies/JiraDataCenterClientStrategy';
import { JiraClientFactory } from './JiraClientFactory';
import { JiraCloudClientStrategy } from '../strategies/JiraCloudClientStrategy';
import { newMockRootConfig } from '../../__fixtures__/testUtils';
import {
  ConnectionStrategy,
  DirectConnectionStrategy,
} from '../strategies/ConnectionStrategy';

jest.mock('../strategies/JiraDataCenterClientStrategy');
jest.mock('../strategies/JiraCloudClientStrategy');

const mockedConnectionStrategy =
  DirectConnectionStrategy as unknown as jest.Mocked<ConnectionStrategy>;

describe('JiraClientFactory', () => {
  let config: Config;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a JiraDataCenterClient when product is datacenter', () => {
    config = newMockRootConfig({ jiraConfig: { product: 'datacenter' } });

    expect(
      JiraClientFactory.create(config, mockedConnectionStrategy),
    ).toBeInstanceOf(JiraDataCenterClientStrategy);
    expect(JiraDataCenterClientStrategy).toHaveBeenCalledWith(
      config,
      mockedConnectionStrategy,
    );
  });

  it('should create a JiraCloudClient when product is cloud', () => {
    config = newMockRootConfig({ jiraConfig: { product: 'cloud' } });

    expect(
      JiraClientFactory.create(config, mockedConnectionStrategy),
    ).toBeInstanceOf(JiraCloudClientStrategy);
    expect(JiraCloudClientStrategy).toHaveBeenCalledWith(
      config,
      mockedConnectionStrategy,
    );
  });

  it('should throw an error when product is invalid', () => {
    config = newMockRootConfig({ jiraConfig: { product: 'foo' } });

    expect(() =>
      JiraClientFactory.create(config, mockedConnectionStrategy),
    ).toThrow(
      "Invalid Jira product: foo. Valid products for 'jira.product' are: datacenter, cloud",
    );
  });
});
