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

import type { JSONSchema7 } from 'json-schema';

import generateReviewTableData from './generateReviewTableData';

describe('mapSchemaToData', () => {
  it('should map schema titles to data values correctly', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      title: 'Person',
      properties: {
        firstName: {
          type: 'string',
          title: 'First Name',
        },
        lastName: {
          type: 'string',
          title: 'Last Name',
        },
        age: {
          type: 'number',
          title: 'Age',
        },
        address: {
          type: 'object',
          title: 'Address',
          properties: {
            street: {
              type: 'string',
              title: 'Street',
            },
            city: {
              type: 'string',
              title: 'City',
            },
          },
        },
      },
    };

    const data = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Somewhere',
      },
    };

    const expectedResult = {
      'First Name': 'John',
      'Last Name': 'Doe',
      Age: 30,
      Address: {
        Street: '123 Main St',
        City: 'Somewhere',
      },
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });

  it('should map schema titles to data values with arrays correctly', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      title: 'Person',
      properties: {
        firstName: {
          type: 'string',
          title: 'First Name',
        },
        hobbies: {
          type: 'array',
          title: 'Hobbies',
          items: {
            type: 'string',
          },
        },
      },
    };

    const data = {
      firstName: 'Jane',
      hobbies: ['reading', 'hiking'],
    };

    const expectedResult = {
      'First Name': 'Jane',
      Hobbies: ['reading', 'hiking'],
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });

  it('should map schema titles to data values with complex nesting correctly', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          title: 'Person',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
            addresses: {
              type: 'array',
              title: 'Addresses',
              items: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const data = {
      person: {
        name: 'John',
        addresses: [
          { street: '123 A St', city: 'City A' },
          { street: '456 B St', city: 'City B' },
        ],
      },
    };

    const expectedResult = {
      Person: {
        Name: 'John',
        Addresses: [
          {
            street: '123 A St',
            city: 'City A',
          },
          {
            street: '456 B St',
            city: 'City B',
          },
        ],
      },
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });

  it('should exclude fields with ui:hidden from review table', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        visibleField: {
          type: 'string',
          title: 'Visible Field',
        },
        hiddenField: {
          type: 'string',
          title: 'Hidden Field',
          'ui:hidden': true,
        } as JSONSchema7,
        anotherVisible: {
          type: 'string',
          title: 'Another Visible',
        },
      },
    };

    const data = {
      visibleField: 'shown',
      hiddenField: 'should not appear',
      anotherVisible: 'also shown',
    };

    const expectedResult = {
      'Visible Field': 'shown',
      'Another Visible': 'also shown',
      // hiddenField should not be present
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });

  it('should include hidden fields when includeHiddenFields is true', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        visibleField: {
          type: 'string',
          title: 'Visible Field',
        },
        hiddenField: {
          type: 'string',
          title: 'Hidden Field',
          'ui:hidden': true,
        } as JSONSchema7,
      },
    };

    const data = {
      visibleField: 'shown',
      hiddenField: 'should appear',
    };

    const expectedResult = {
      'Visible Field': 'shown',
      'Hidden Field': 'should appear',
    };

    const result = generateReviewTableData(schema, data, {
      includeHiddenFields: true,
    });
    expect(result).toEqual(expectedResult);
  });

  it('should exclude nested hidden fields from review table', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          title: 'Person',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
            secret: {
              type: 'string',
              title: 'Secret',
              'ui:hidden': true,
            } as JSONSchema7,
            age: {
              type: 'number',
              title: 'Age',
            },
          },
        },
      },
    };

    const data = {
      person: {
        name: 'John',
        secret: 'hidden-value',
        age: 30,
      },
    };

    const expectedResult = {
      Person: {
        Name: 'John',
        Age: 30,
        // secret should not be present
      },
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });

  it('should exclude entire step when all fields are hidden', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        visibleStep: {
          type: 'object',
          title: 'Visible Step',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
          },
        },
        allHiddenStep: {
          type: 'object',
          title: 'All Hidden Step',
          properties: {
            hiddenField1: {
              type: 'string',
              title: 'Hidden Field 1',
              'ui:hidden': true,
            } as JSONSchema7,
            hiddenField2: {
              type: 'string',
              title: 'Hidden Field 2',
              'ui:hidden': true,
            } as JSONSchema7,
          },
        },
        anotherVisibleStep: {
          type: 'object',
          title: 'Another Visible Step',
          properties: {
            email: {
              type: 'string',
              title: 'Email',
            },
          },
        },
      },
    };

    const data = {
      visibleStep: {
        name: 'John',
      },
      allHiddenStep: {
        hiddenField1: 'secret1',
        hiddenField2: 'secret2',
      },
      anotherVisibleStep: {
        email: 'test@example.com',
      },
    };

    const expectedResult = {
      'Visible Step': {
        Name: 'John',
      },
      // allHiddenStep should not be present at all
      'Another Visible Step': {
        Email: 'test@example.com',
      },
    };

    const result = generateReviewTableData(schema, data);
    expect(result).toEqual(expectedResult);
  });
});
