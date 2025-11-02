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

import { JSONSchema7 } from 'json-schema';

import { pruneFormData } from './pruneFormData';

describe('pruneFormData', () => {
  describe('Basic Property Handling', () => {
    it('should remove properties not in schema', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const formData = {
        name: 'John',
        age: 30,
        obsoleteField: 'should be removed',
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        name: 'John',
        age: 30,
      });
      expect(result).not.toHaveProperty('obsoleteField');
    });

    it('should keep all valid properties', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          active: { type: 'boolean' },
        },
      };

      const formData = {
        name: 'Jane',
        email: 'jane@example.com',
        active: true,
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual(formData);
    });

    it('should skip undefined values in formData', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const formData = {
        name: 'Alice',
        age: undefined,
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        name: 'Alice',
      });
      expect(result).not.toHaveProperty('age');
    });

    it('should handle empty form data', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const result = pruneFormData({}, schema);

      expect(result).toEqual({});
    });

    it('should handle schema without properties', () => {
      const schema: JSONSchema7 = {
        type: 'object',
      };

      const formData = {
        anything: 'here',
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({});
    });
  });

  describe('Nested Objects', () => {
    it('should handle nested objects', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
        },
      };

      const formData = {
        user: {
          name: 'Bob',
          age: 25,
          obsoleteNested: 'remove me',
        },
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        user: {
          name: 'Bob',
          age: 25,
        },
      });
    });

    it('should handle multi-step form schema', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          step1: {
            type: 'object',
            properties: {
              field1: { type: 'string' },
              field2: { type: 'string' },
            },
          },
          step2: {
            type: 'object',
            properties: {
              field3: { type: 'number' },
            },
          },
        },
      };

      const formData = {
        step1: {
          field1: 'value1',
          field2: 'value2',
          oldField: 'removed',
        },
        step2: {
          field3: 123,
          anotherOldField: 'also removed',
        },
        completelyObsoleteStep: {
          data: 'removed',
        },
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        step1: {
          field1: 'value1',
          field2: 'value2',
        },
        step2: {
          field3: 123,
        },
      });
    });

    it('should handle deeply nested objects', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'object',
                    properties: {
                      deepField: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const formData = {
        level1: {
          level2: {
            level3: {
              deepField: 'value',
              obsoleteDeep: 'remove',
            },
            obsolete2: 'remove',
          },
          obsolete1: 'remove',
        },
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              deepField: 'value',
            },
          },
        },
      });
    });
  });

  describe('Arrays', () => {
    it('should preserve arrays', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };

      const formData = {
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        tags: ['tag1', 'tag2', 'tag3'],
      });
    });

    it('should preserve complex arrays', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
        },
      };

      const formData = {
        items: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' },
        ],
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual(formData);
    });
  });

  describe('JSON Schema Dependencies', () => {
    it('should handle simple dependencies (array form)', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          creditCard: { type: 'string' },
        },
        dependencies: {
          creditCard: ['billingAddress'],
        },
      };

      const formData = {
        name: 'John',
        creditCard: '1234',
        billingAddress: '123 Main St',
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual(formData);
    });

    it('should handle schema dependencies with oneOf', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          configOption: {
            type: 'string',
            enum: ['simple', 'advanced'],
          },
          name: { type: 'string' },
          email: { type: 'string' },
        },
        dependencies: {
          configOption: {
            oneOf: [
              {
                properties: {
                  configOption: { enum: ['simple'] },
                },
              },
              {
                properties: {
                  configOption: { enum: ['advanced'] },
                  advancedField1: { type: 'string' },
                  advancedField2: { type: 'string' },
                },
              },
            ],
          },
        },
      };

      // Test with advanced mode selected
      const formDataAdvanced = {
        configOption: 'advanced',
        name: 'John',
        email: 'john@example.com',
        advancedField1: 'extra1',
        advancedField2: 'extra2',
      };

      const resultAdvanced = pruneFormData(formDataAdvanced, schema);

      expect(resultAdvanced).toEqual(formDataAdvanced);
      expect(resultAdvanced).toHaveProperty('advancedField1');
      expect(resultAdvanced).toHaveProperty('advancedField2');
    });

    it('should remove conditional fields when condition not met', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          configOption: {
            type: 'string',
            enum: ['simple', 'advanced'],
          },
          name: { type: 'string' },
        },
        dependencies: {
          configOption: {
            oneOf: [
              {
                properties: {
                  configOption: { enum: ['simple'] },
                },
              },
              {
                properties: {
                  configOption: { enum: ['advanced'] },
                  advancedField1: { type: 'string' },
                  advancedField2: { type: 'string' },
                },
              },
            ],
          },
        },
      };

      // Test with simple mode but obsolete advanced fields
      const formDataSimple = {
        configOption: 'simple',
        name: 'John',
        advancedField1: 'should be removed',
        advancedField2: 'should be removed',
      };

      const resultSimple = pruneFormData(formDataSimple, schema);

      expect(resultSimple).toEqual({
        configOption: 'simple',
        name: 'John',
      });
      expect(resultSimple).not.toHaveProperty('advancedField1');
      expect(resultSimple).not.toHaveProperty('advancedField2');
    });
  });

  describe('Conditional Schemas (oneOf, anyOf, allOf)', () => {
    it('should handle allOf schemas', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        allOf: [
          {
            properties: {
              name: { type: 'string' },
            },
          },
          {
            properties: {
              email: { type: 'string' },
            },
          },
        ],
      };

      const formData = {
        name: 'John',
        email: 'john@example.com',
        obsolete: 'remove',
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle test-pruning-demo schema (advanced mode)', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          step1: {
            type: 'object',
            title: 'Step 1 - Configuration',
            properties: {
              configOption: {
                type: 'string',
                enum: ['simple', 'advanced'],
              },
              name: { type: 'string' },
              email: { type: 'string' },
            },
            dependencies: {
              configOption: {
                oneOf: [
                  {
                    properties: {
                      configOption: { enum: ['simple'] },
                    },
                  },
                  {
                    properties: {
                      configOption: { enum: ['advanced'] },
                      advancedField1: { type: 'string' },
                      advancedField2: { type: 'string' },
                    },
                  },
                ],
              },
            },
          },
          step2: {
            type: 'object',
            title: 'Step 2',
            properties: {
              notes: { type: 'string' },
            },
          },
        },
      };

      const formData = {
        step1: {
          configOption: 'advanced',
          name: 'John Doe',
          email: 'john@example.com',
          advancedField1: 'Extra data 1',
          advancedField2: 'Extra data 2',
        },
        step2: {
          notes: 'test',
        },
      };

      const result = pruneFormData(formData, schema);

      expect(result).toEqual(formData);
      expect(result.step1).toHaveProperty('advancedField1');
      expect(result.step1).toHaveProperty('advancedField2');
    });

    it('should handle test-pruning-demo schema (simple mode)', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          step1: {
            type: 'object',
            title: 'Step 1 - Configuration',
            properties: {
              configOption: {
                type: 'string',
                enum: ['simple', 'advanced'],
              },
              name: { type: 'string' },
              email: { type: 'string' },
            },
            dependencies: {
              configOption: {
                oneOf: [
                  {
                    properties: {
                      configOption: { enum: ['simple'] },
                    },
                  },
                  {
                    properties: {
                      configOption: { enum: ['advanced'] },
                      advancedField1: { type: 'string' },
                      advancedField2: { type: 'string' },
                    },
                  },
                ],
              },
            },
          },
          step2: {
            type: 'object',
            title: 'Step 2',
            properties: {
              notes: { type: 'string' },
            },
          },
        },
      };

      const formData = {
        step1: {
          configOption: 'simple',
          name: 'John Doe',
          email: 'john@example.com',
          advancedField1: 'Should be removed',
          advancedField2: 'Should be removed',
        },
        step2: {
          notes: 'test',
        },
      };

      const result = pruneFormData(formData, schema);

      expect(result.step1).toEqual({
        configOption: 'simple',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result.step1).not.toHaveProperty('advancedField1');
      expect(result.step1).not.toHaveProperty('advancedField2');
    });
  });
});
