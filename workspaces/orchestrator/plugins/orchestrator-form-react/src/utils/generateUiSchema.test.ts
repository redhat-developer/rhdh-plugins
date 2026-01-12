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

import { UiSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';

import generateUiSchema from './generateUiSchema';

describe('extract ui schema', () => {
  it('if has properties ui: should create ui schema with properties', () => {
    const expected = {
      name: { 'ui:validationType': 'product', 'ui:autofocus': true },
      color: { 'ui:widget': 'color1', 'ui:validationType': 'color' },
    };
    const mixedSchema: JSONSchema7 = {
      title: 'Product',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Product Name',
          'ui:validationType': 'product',
        },
        color: {
          type: 'string',
          title: 'Product Color',
          description: 'The color of the product',
          'ui:widget': 'color1',
          'ui:validationType': 'color',
        },
      },
      required: ['name', 'color'],
    } as JSONSchema7;
    const uiSchema = generateUiSchema(mixedSchema, false);
    expect(uiSchema).toEqual(expected);
  });

  it('if no properties ui: should create ui schema just with auto focus', () => {
    const mixedSchema: JSONSchema7 = {
      title: 'Product',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Product Name',
        },
        color: {
          type: 'string',
          title: 'Product Color',
          description: 'The color of the product',
        },
      },
      required: ['name', 'color'],
    } as JSONSchema7;
    const uiSchema = generateUiSchema(mixedSchema, false);
    expect(uiSchema).toEqual({ name: { 'ui:autofocus': true } });
  });

  it('should extract from array', () => {
    const mixedSchema = {
      title: 'A list of tasks',
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'string',
          title: 'Task list title',
        },
        tasks: {
          type: 'array',
          title: 'Tasks',
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              title: {
                type: 'string',
                title: 'Title',
                description: 'A sample title',
              },
              details: {
                type: 'string',
                title: 'Task details',
                description: 'Enter the task details',
                'ui:widget': 'textarea',
              },
              done: {
                type: 'boolean',
                title: 'Done?',
                default: false,
              },
            },
          },
        },
      },
    } as JSONSchema7;
    const expected = {
      title: {
        'ui:autofocus': true,
      },
      tasks: {
        items: {
          details: {
            'ui:widget': 'textarea',
          },
        },
      },
    } as UiSchema;
    const uiSchema = generateUiSchema(mixedSchema, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract from array with fixed number of items', () => {
    const mixedSchema = {
      type: 'object',
      properties: {
        fixedItemsList: {
          type: 'array',
          title: 'A list of fixed items',
          items: [
            {
              title: 'A string value',
              type: 'string',
              default: 'lorem ipsum',
              'ui:widget': 'textarea',
            },
            {
              title: 'a boolean value',
              type: 'boolean',
            },
          ],
          additionalItems: {
            title: 'Additional item',
            type: 'number',
          },
        },
      },
    } as JSONSchema7;
    const expected = {
      fixedItemsList: {
        items: [
          {
            'ui:widget': 'textarea',
          },
        ],
        'ui:autofocus': true,
      },
    } as JSONSchema7;

    const uiSchema = generateUiSchema(mixedSchema, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle anyOf', () => {
    const schemaWithAnyOf = {
      title: 'A selection of items',
      type: 'object',
      properties: {
        selectedItem: {
          anyOf: [
            { type: 'number', title: 'Number item' },
            { type: 'boolean', title: 'Boolean item' },
            { type: 'string', title: 'Color', 'ui:widget': 'color' },
          ],
        },
      },
    } as JSONSchema7;

    const expected = {
      selectedItem: {
        anyOf: [{}, {}, { 'ui:widget': 'color' }],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithAnyOf, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle oneOf', () => {
    const schemaWithAnyOf = {
      title: 'A selection of items',
      type: 'object',
      properties: {
        selectedItem: {
          oneOf: [
            { type: 'string', title: 'Color', 'ui:widget': 'color' },
            { type: 'number', title: 'Number item' },
            { type: 'boolean', title: 'Boolean item' },
          ],
        },
      },
    } as JSONSchema7;

    const expected = {
      selectedItem: {
        oneOf: [{ 'ui:widget': 'color' }],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithAnyOf, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle allOf', () => {
    const schemaWithAnyOf = {
      title: 'A selection of items',
      type: 'object',
      properties: {
        selectedItem: {
          allOf: [
            { type: 'string', title: 'Color', 'ui:widget': 'color' },
            { type: 'number', title: 'Number item' },
            { type: 'boolean', title: 'Boolean item' },
          ],
        },
      },
    } as JSONSchema7;

    const expected = {
      selectedItem: {
        allOf: [{ 'ui:widget': 'color' }],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithAnyOf, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle referenced schemas', () => {
    const refSchema = {
      title: 'A referenced schema',
      type: 'object',
      properties: {
        user: {
          $ref: '#/definitions/User',
        },
      },
      definitions: {
        User: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              title: 'First name',
              'ui:widget': 'textarea',
              'ui:autofocus': true,
            },
            lastName: { type: 'string', title: 'Last name' },
          },
        },
      },
    } as JSONSchema7;

    const expected = {
      user: {
        firstName: { 'ui:autofocus': true, 'ui:widget': 'textarea' },
      },
    };

    const uiSchema = generateUiSchema(refSchema, true);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle schemas with multiple hierarchies', () => {
    const complexSchema = {
      title: 'Complex schema with multiple hierarchies',
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            password: {
              type: 'string',
              title: 'Name',
              'ui:widget': 'password',
            },
            address: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  title: 'Street',
                  'ui:widget': 'textarea',
                },
                city: {
                  type: 'string',
                  title: 'City',
                  'ui:widget': 'textarea',
                },
              },
            },
          },
        },
      },
    } as JSONSchema7;

    const expected = {
      person: {
        name: { 'ui:autofocus': true },
        password: { 'ui:widget': 'password' },
        address: {
          street: { 'ui:widget': 'textarea' },
          city: { 'ui:widget': 'textarea' },
        },
      },
    };

    const uiSchema = generateUiSchema(complexSchema, true);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle if/then/else schema with ui:widget: "textarea"', () => {
    const schemaWithIfThenElse = {
      title: 'Conditional Schema',
      type: 'object',
      properties: {
        age: { type: 'number', title: 'Age', 'ui:autofocus': true },
      },
      if: {
        properties: { age: { minimum: 18 } },
      },
      then: {
        properties: {
          canVote: {
            type: 'boolean',
            title: 'Can vote?',
            'ui:description': 'can vote',
          },
        },
      },
      else: {
        properties: {
          needsConsent: {
            type: 'boolean',
            title: 'Needs parental consent?',
            'ui:description': 'needs consent',
          },
        },
      },
    } as JSONSchema7;

    const expected = {
      age: { 'ui:autofocus': true },
      canVote: { 'ui:description': 'can vote' },
      needsConsent: { 'ui:description': 'needs consent' },
    };

    const uiSchema = generateUiSchema(schemaWithIfThenElse, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle a complex schema with various ui: properties and $ref', () => {
    const complexSchema = {
      title: 'Complex Schema Example',
      type: 'object',
      properties: {
        userInfo: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              'ui:autofocus': true,
              'ui:widget': 'text',
              'ui:placeholder': 'Enter your name',
              'ui:description': 'Full legal name',
            },
            age: {
              type: 'number',
              title: 'Age',
              'ui:widget': 'updown',
              'ui:help': 'Enter your age in years',
            },
            address: {
              $ref: '#/definitions/Address',
            },
          },
        },
        tasks: {
          type: 'array',
          title: 'Tasks',
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              title: {
                type: 'string',
                title: 'Title',
                'ui:widget': 'color',
                'ui:description': 'Color-coded task title',
              },
              details: {
                type: 'string',
                title: 'Task details',
                'ui:widget': 'textarea',
                'ui:placeholder': 'Describe the task in detail',
              },
              done: {
                type: 'boolean',
                title: 'Done?',
                'ui:widget': 'checkbox',
              },
            },
          },
        },
        preferences: {
          type: 'object',
          properties: {
            notifications: {
              anyOf: [
                {
                  type: 'boolean',
                  title: 'Receive Notifications',
                  'ui:widget': 'radio',
                  'ui:options': { inline: true },
                },
                {
                  type: 'string',
                  title: 'Notification Email',
                  'ui:widget': 'email',
                  'ui:placeholder': 'you@example.com',
                },
              ],
            },
          },
        },
      },
      definitions: {
        Address: {
          type: 'object',
          properties: {
            street: {
              type: 'string',
              title: 'Street',
              'ui:widget': 'textarea',
              'ui:placeholder': '123 Main St',
            },
            city: {
              type: 'string',
              title: 'City',
              'ui:widget': 'select',
              'ui:emptyValue': 'Select a city',
            },
          },
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      userInfo: {
        name: {
          'ui:autofocus': true,
          'ui:widget': 'text',
          'ui:placeholder': 'Enter your name',
          'ui:description': 'Full legal name',
        },
        age: {
          'ui:widget': 'updown',
          'ui:help': 'Enter your age in years',
        },
        address: {
          street: {
            'ui:widget': 'textarea',
            'ui:placeholder': '123 Main St',
          },
          city: {
            'ui:widget': 'select',
            'ui:emptyValue': 'Select a city',
          },
        },
      },
      tasks: {
        items: {
          title: {
            'ui:widget': 'color',
            'ui:description': 'Color-coded task title',
          },
          details: {
            'ui:widget': 'textarea',
            'ui:placeholder': 'Describe the task in detail',
          },
          done: {
            'ui:widget': 'checkbox',
          },
        },
      },
      preferences: {
        notifications: {
          anyOf: [
            {
              'ui:widget': 'radio',
              'ui:options': { inline: true },
            },
            {
              'ui:widget': 'email',
              'ui:placeholder': 'you@example.com',
            },
          ],
        },
      },
    };

    const uiSchema = generateUiSchema(complexSchema, true);
    expect(uiSchema).toEqual(expected);
  });
});

describe('processOrder function', () => {
  it('should extract ui:order from root schema properties', () => {
    const schemaWithOrder: JSONSchema7 = {
      title: 'Form with order',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
        },
        email: {
          type: 'string',
          title: 'Email',
        },
        age: {
          type: 'number',
          title: 'Age',
        },
      },
      'ui:order': ['email', 'name', 'age'],
    } as JSONSchema7;

    const expected = {
      'ui:order': ['email', 'name', 'age'],
      name: { 'ui:autofocus': true },
    };

    const uiSchema = generateUiSchema(schemaWithOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from nested object properties', () => {
    const schemaWithNestedOrder: JSONSchema7 = {
      title: 'Form with nested order',
      type: 'object',
      properties: {
        personalInfo: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              title: 'First Name',
            },
            lastName: {
              type: 'string',
              title: 'Last Name',
            },
            middleName: {
              type: 'string',
              title: 'Middle Name',
            },
          },
          'ui:order': ['lastName', 'firstName', 'middleName'],
        },
        contactInfo: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              title: 'Phone',
            },
            email: {
              type: 'string',
              title: 'Email',
            },
          },
          'ui:order': ['phone', 'email'],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      personalInfo: {
        firstName: { 'ui:autofocus': true },
        'ui:order': ['lastName', 'firstName', 'middleName'],
      },
      contactInfo: {
        phone: { 'ui:autofocus': true },
        'ui:order': ['phone', 'email'],
      },
    };

    const uiSchema = generateUiSchema(schemaWithNestedOrder, true);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from array items', () => {
    const schemaWithArrayOrder: JSONSchema7 = {
      title: 'Form with array order',
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
              },
              description: {
                type: 'string',
                title: 'Description',
              },
              priority: {
                type: 'number',
                title: 'Priority',
              },
            },
            'ui:order': ['priority', 'name', 'description'],
          },
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      items: {
        items: {
          'ui:order': ['priority', 'name', 'description'],
        },
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithArrayOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from fixed array items', () => {
    const schemaWithFixedArrayOrder: JSONSchema7 = {
      title: 'Form with fixed array order',
      type: 'object',
      properties: {
        fixedItems: {
          type: 'array',
          items: [
            {
              type: 'object',
              properties: {
                field1: { type: 'string' },
                field2: { type: 'string' },
                field3: { type: 'string' },
              },
              'ui:order': ['field3', 'field1', 'field2'],
            },
            {
              type: 'object',
              properties: {
                fieldA: { type: 'string' },
                fieldB: { type: 'string' },
              },
              'ui:order': ['fieldB', 'fieldA'],
            },
          ],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      fixedItems: {
        items: [
          {
            'ui:order': ['field3', 'field1', 'field2'],
          },
          {
            'ui:order': ['fieldB', 'fieldA'],
          },
        ],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithFixedArrayOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from anyOf schemas', () => {
    const schemaWithAnyOfOrder: JSONSchema7 = {
      title: 'Form with anyOf order',
      type: 'object',
      properties: {
        variant: {
          anyOf: [
            {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' },
                label: { type: 'string' },
              },
              'ui:order': ['label', 'type', 'value'],
            },
            {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
              'ui:order': ['name', 'id'],
            },
          ],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      variant: {
        anyOf: [
          {
            'ui:order': ['label', 'type', 'value'],
          },
          {
            'ui:order': ['name', 'id'],
          },
        ],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithAnyOfOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from oneOf schemas', () => {
    const schemaWithOneOfOrder: JSONSchema7 = {
      title: 'Form with oneOf order',
      type: 'object',
      properties: {
        choice: {
          oneOf: [
            {
              type: 'object',
              properties: {
                optionA: { type: 'string' },
                optionB: { type: 'string' },
                optionC: { type: 'string' },
              },
              'ui:order': ['optionC', 'optionA', 'optionB'],
            },
          ],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      choice: {
        oneOf: [
          {
            'ui:order': ['optionC', 'optionA', 'optionB'],
          },
        ],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithOneOfOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from allOf schemas', () => {
    const schemaWithAllOfOrder: JSONSchema7 = {
      title: 'Form with allOf order',
      type: 'object',
      properties: {
        combined: {
          allOf: [
            {
              type: 'object',
              properties: {
                field1: { type: 'string' },
                field2: { type: 'string' },
              },
              'ui:order': ['field2', 'field1'],
            },
          ],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      combined: {
        allOf: [
          {
            'ui:order': ['field2', 'field1'],
          },
        ],
        'ui:autofocus': true,
      },
    };

    const uiSchema = generateUiSchema(schemaWithAllOfOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should extract ui:order from referenced schemas', () => {
    const schemaWithRefOrder: JSONSchema7 = {
      title: 'Form with referenced order',
      type: 'object',
      properties: {
        user: {
          $ref: '#/definitions/User',
        },
      },
      definitions: {
        User: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
          'ui:order': ['email', 'firstName', 'lastName'],
        },
      },
    } as unknown as JSONSchema7;

    const expected = {
      user: {
        firstName: { 'ui:autofocus': true },
        'ui:order': ['email', 'firstName', 'lastName'],
      },
    };

    const uiSchema = generateUiSchema(schemaWithRefOrder, true);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle multiple ui:order properties at different levels', () => {
    const complexSchemaWithMultipleOrders: JSONSchema7 = {
      title: 'Complex form with multiple orders',
      type: 'object',
      properties: {
        section1: {
          type: 'object',
          properties: {
            field1: { type: 'string' },
            field2: { type: 'string' },
          },
          'ui:order': ['field2', 'field1'],
        },
        section2: {
          type: 'object',
          properties: {
            fieldA: { type: 'string' },
            fieldB: { type: 'string' },
          },
          'ui:order': ['fieldB', 'fieldA'],
        },
      },
      'ui:order': ['section2', 'section1'],
    } as unknown as JSONSchema7;

    const expected = {
      'ui:order': ['section2', 'section1'],
      section1: {
        field1: { 'ui:autofocus': true },
        'ui:order': ['field2', 'field1'],
      },
      section2: {
        fieldA: { 'ui:autofocus': true },
        'ui:order': ['fieldB', 'fieldA'],
      },
    };

    const uiSchema = generateUiSchema(complexSchemaWithMultipleOrders, true);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle ui:order with wildcard (*)', () => {
    const schemaWithWildcardOrder: JSONSchema7 = {
      title: 'Form with wildcard order',
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
      },
      'ui:order': ['name', '*', 'address'],
    } as unknown as JSONSchema7;

    const expected = {
      'ui:order': ['name', '*', 'address'],
      name: { 'ui:autofocus': true },
    };

    const uiSchema = generateUiSchema(schemaWithWildcardOrder, false);
    expect(uiSchema).toEqual(expected);
  });

  it('should handle schema without ui:order properties', () => {
    const schemaWithoutOrder: JSONSchema7 = {
      title: 'Form without order',
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
      },
    };

    const expected = {
      name: { 'ui:autofocus': true },
    };

    const uiSchema = generateUiSchema(schemaWithoutOrder, false);
    expect(uiSchema).toEqual(expected);
  });
});
