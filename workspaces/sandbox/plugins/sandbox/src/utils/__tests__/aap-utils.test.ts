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
import { decode, getReadyCondition, AnsibleStatus } from '../aap-utils';
import { AAPData, StatusCondition } from '../../types';

describe('aap-utils', () => {
  describe('decode', () => {
    it('should correctly decode base64 strings', () => {
      const encoded = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      expect(decode(encoded)).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(decode('')).toBe('');
    });

    it('should handle non-ascii characters', () => {
      const encoded = '44GT44KT44Gr44Gh44Gv'; // "こんにちは" in base64
      expect(decode(encoded)).toBeDefined();
    });
  });

  describe('getReadyCondition', () => {
    const mockSetError = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return NEW status when data is undefined', () => {
      expect(getReadyCondition(undefined, mockSetError)).toBe(
        AnsibleStatus.NEW,
      );
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return NEW status when items array is empty', () => {
      const data: AAPData = { items: [] };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.NEW);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return UNKNOWN status when status or conditions are missing', () => {
      const data: AAPData = {
        items: [
          {
            status: {
              conditions: [],
              URL: '',
              adminPasswordSecret: '',
              adminUser: '',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.UNKNOWN);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return IDLED status when idle_aap is true', () => {
      const data: AAPData = {
        items: [
          {
            status: {
              conditions: [
                {
                  type: 'Running',
                  status: 'False',
                  reason: 'Idled',
                  message: 'Instance is idled',
                },
              ],
              URL: '',
              adminPasswordSecret: '',
              adminUser: '',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: true },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.IDLED);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return READY status when Successful condition is true', () => {
      const conditions: StatusCondition[] = [
        {
          type: 'Successful',
          status: 'True',
          reason: 'Successful',
          message: '',
        },
      ];
      const data: AAPData = {
        items: [
          {
            status: {
              conditions,
              URL: 'http://test.com',
              adminPasswordSecret: 'secret',
              adminUser: 'admin',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.READY);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return UNKNOWN and set error when Failure condition is true', () => {
      const errorMessage = 'Something went wrong';
      const conditions: StatusCondition[] = [
        {
          type: 'Failure',
          status: 'True',
          reason: 'Failed',
          message: errorMessage,
        },
      ];
      const data: AAPData = {
        items: [
          {
            status: {
              conditions,
              URL: '',
              adminPasswordSecret: '',
              adminUser: '',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.UNKNOWN);
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    });

    it('should return PROVISIONING when Running condition is true', () => {
      const conditions: StatusCondition[] = [
        {
          type: 'Running',
          status: 'True',
          reason: 'Running',
          message: 'Running reconciliation',
        },
      ];
      const data: AAPData = {
        items: [
          {
            status: {
              conditions,
              URL: '',
              adminPasswordSecret: '',
              adminUser: '',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(
        AnsibleStatus.PROVISIONING,
      );
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should return UNKNOWN when no relevant conditions are true', () => {
      const conditions: StatusCondition[] = [
        {
          type: 'Unknown',
          status: 'False',
          reason: '',
          message: '',
        },
      ];
      const data: AAPData = {
        items: [
          {
            status: {
              conditions,
              URL: '',
              adminPasswordSecret: '',
              adminUser: '',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.UNKNOWN);
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('should handle multiple conditions and prioritize them correctly', () => {
      const conditions: StatusCondition[] = [
        {
          type: 'Running',
          status: 'True',
          reason: 'Running',
          message: 'Running reconciliation',
        },
        {
          type: 'Successful',
          status: 'True',
          reason: 'Successful',
          message: '',
        },
      ];
      const data: AAPData = {
        items: [
          {
            status: {
              conditions,
              URL: 'http://test.com',
              adminPasswordSecret: 'secret',
              adminUser: 'admin',
            },
            metadata: {
              name: 'test',
              uuid: '123',
              creationTimestamp: '2024-01-01',
            },
            spec: { idle_aap: false },
          },
        ],
      };
      expect(getReadyCondition(data, mockSetError)).toBe(AnsibleStatus.READY);
      expect(mockSetError).not.toHaveBeenCalled();
    });
  });

  describe('AAPObject', () => {
    it('should be valid JSON', () => {
      const { AAPObject } = require('../aap-utils');
      expect(() => JSON.parse(AAPObject)).not.toThrow();
    });

    it('should have required fields', () => {
      const { AAPObject } = require('../aap-utils');
      const parsed = JSON.parse(AAPObject);

      expect(parsed.apiVersion).toBe('aap.ansible.com/v1alpha1');
      expect(parsed.kind).toBe('AnsibleAutomationPlatform');
      expect(parsed.metadata.name).toBe('sandbox-aap');
      expect(parsed.spec).toBeDefined();
    });

    it('should have correct resource configurations', () => {
      const { AAPObject } = require('../aap-utils');
      const parsed = JSON.parse(AAPObject);

      expect(parsed.spec.idle_aap).toBe(false);
      expect(parsed.spec.no_log).toBe(false);
      expect(parsed.spec.api.replicas).toBe(1);
      expect(parsed.spec.hub.storage_type).toBe('file');
      expect(parsed.spec.hub.file_storage_storage_class).toBe('efs-sc');
    });
  });
});
