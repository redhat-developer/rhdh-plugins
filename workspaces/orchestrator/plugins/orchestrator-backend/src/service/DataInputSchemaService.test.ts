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

import { WORKFLOW_DATA_KEY } from './constants';
import { DataInputSchemaService } from './DataInputSchemaService';

describe('DataInputSchemaService', () => {
  let service: DataInputSchemaService;

  beforeEach(() => {
    service = new DataInputSchemaService();
  });

  describe('extractWorkflowData', () => {
    it('should extract workflow data when WORKFLOW_DATA_KEY is present', () => {
      const workflowData = {
        name: 'Test Workflow',
        version: '1.0.0',
        parameters: { param1: 'value1' },
      };
      const variables = {
        [WORKFLOW_DATA_KEY]: workflowData,
        otherKey: 'other value',
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toEqual(workflowData);
    });

    it('should return undefined when WORKFLOW_DATA_KEY is not present', () => {
      const variables = {
        someKey: 'some value',
        anotherKey: 'another value',
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toBeUndefined();
    });

    it('should return undefined when variables is undefined', () => {
      const result = service.extractWorkflowData(undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined when variables is an empty object', () => {
      const variables = {};

      const result = service.extractWorkflowData(variables);

      expect(result).toBeUndefined();
    });

    it('should extract workflow data when it is an empty object', () => {
      const variables = {
        [WORKFLOW_DATA_KEY]: {},
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toEqual({});
    });

    it('should extract workflow data when it contains nested objects', () => {
      const workflowData = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
        array: [1, 2, 3],
      };
      const variables = {
        [WORKFLOW_DATA_KEY]: workflowData,
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toEqual(workflowData);
    });

    it('should extract workflow data when it is null', () => {
      const variables = {
        [WORKFLOW_DATA_KEY]: null,
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toBeNull();
    });

    it('should extract workflow data when it contains arrays', () => {
      const workflowData = ['item1', 'item2', 'item3'];
      const variables = {
        [WORKFLOW_DATA_KEY]: workflowData,
      };

      const result = service.extractWorkflowData(variables);

      expect(result).toEqual(workflowData);
    });
  });
});
