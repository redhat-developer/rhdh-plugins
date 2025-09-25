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
import { JiraDataCenterClient } from '../clients/JiraDataCenterClient';
import { JiraClientFactory } from './JiraClientFactory';
import { JiraCloudClient } from '../clients/JiraCloudClient';

jest.mock('../clients/JiraDataCenterClient');
jest.mock('../clients/JiraCloudClient');

const getConfig = (product: string) => {
  return mockServices.rootConfig({
    data: {
      jira: {
        product,
      },
    },
  });
};

describe('JiraClientFactory', () => {
  let config: Config;

  beforeEach(() => {
    config = getConfig('datacenter');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when product is datacenter', () => {
    it('should create a JiraDataCenterClient', () => {
      const client = JiraClientFactory.create(config);
      expect(JiraDataCenterClient).toHaveBeenCalledWith(config);
      expect(client).toBeInstanceOf(JiraDataCenterClient);
    });
  });

  describe('when product is cloud', () => {
    beforeEach(() => {
      config = getConfig('cloud');
    });

    it('should create a JiraCloudClient', () => {
      const client = JiraClientFactory.create(config);
      expect(JiraCloudClient).toHaveBeenCalledWith(config);
      expect(client).toBeInstanceOf(JiraCloudClient);
    });
  });

  describe('when product is invalid', () => {
    beforeEach(() => {
      config = getConfig('foo');
    });

    it('should throw an error', () => {
      expect(() => JiraClientFactory.create(config)).toThrow(
        "Invalid Jira product: foo. Valid products for 'jira.product' are: datacenter, cloud",
      );
    });
  });
});
