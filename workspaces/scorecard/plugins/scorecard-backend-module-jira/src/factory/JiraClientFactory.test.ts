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
import { JiraDataCenterClient } from '../clients/JiraDataCenterClient';
import { JiraClientFactory } from './JiraClientFactory';
import { JiraCloudClient } from '../clients/JiraCloudClient';

jest.mock('../clients/JiraDataCenterClient');
jest.mock('../clients/JiraCloudClient');

const getOptional = jest.fn().mockReturnValue({ product: 'datacenter' });
const mockConfig = { getOptional } as unknown as jest.Mocked<Config>;

describe('JiraClientFactory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when jira config is not exist', () => {
    beforeEach(() => {
      getOptional.mockReturnValue(undefined);
    });

    it('should throw an error', () => {
      expect(() => JiraClientFactory.create(mockConfig)).toThrow(
        'Missing Jira integration config',
      );
    });
  });

  describe('when jira config is not an object', () => {
    beforeEach(() => {
      getOptional.mockReturnValue('not-an-object');
    });

    it('should throw an error', () => {
      expect(() => JiraClientFactory.create(mockConfig)).toThrow(
        'Missing Jira integration config',
      );
    });
  });

  describe('when product is not exist in jira config', () => {
    beforeEach(() => {
      getOptional.mockReturnValue({});
    });

    it('should throw an error', () => {
      expect(() => JiraClientFactory.create(mockConfig)).toThrow(
        'Jira product not found in config',
      );
    });
  });

  describe('when jira config is valid', () => {
    describe('when product is datacenter', () => {
      beforeEach(() => {
        getOptional.mockReturnValue({ product: 'datacenter' });
      });

      it('should create a JiraDataCenterClient', () => {
        const client = JiraClientFactory.create(mockConfig);

        expect(JiraDataCenterClient).toHaveBeenCalledWith(mockConfig);
        expect(client).toBeInstanceOf(JiraDataCenterClient);
      });
    });

    describe('when product is cloud', () => {
      beforeEach(() => {
        getOptional.mockReturnValue({ product: 'cloud' });
      });

      it('should create a JiraCloudClient', () => {
        const client = JiraClientFactory.create(mockConfig);

        expect(JiraCloudClient).toHaveBeenCalledWith(mockConfig);
        expect(client).toBeInstanceOf(JiraCloudClient);
      });
    });

    describe('when product is invalid', () => {
      beforeEach(() => {
        getOptional.mockReturnValue({ product: 'foo' });
      });

      it('should throw an error', () => {
        expect(() => JiraClientFactory.create(mockConfig)).toThrow(
          'Invalid Jira product: foo. Valid products are: datacenter, cloud',
        );
      });
    });
  });
});
