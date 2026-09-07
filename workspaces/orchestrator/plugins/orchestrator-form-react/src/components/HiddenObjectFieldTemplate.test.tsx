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

import '@testing-library/jest-dom';

import { JsonObject } from '@backstage/types';

import { getDefaultRegistry } from '@rjsf/core';
import { ObjectFieldTemplateProps, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import type { JSONSchema7 } from 'json-schema';

import HiddenObjectFieldTemplate from './HiddenObjectFieldTemplate';

const schema: JSONSchema7 = {
  type: 'object',
  properties: {
    visibleField: { type: 'string' },
    hiddenField: { type: 'string' },
  },
};

const registry = getDefaultRegistry<JsonObject, JSONSchema7>();

const createProps = (
  overrides: Partial<ObjectFieldTemplateProps<JsonObject, JSONSchema7>> = {},
): ObjectFieldTemplateProps<JsonObject, JSONSchema7> => ({
  title: '',
  properties: [
    {
      name: 'visibleField',
      content: <div data-testid="visible-content">Visible</div>,
      hidden: false,
    },
    {
      name: 'hiddenField',
      content: <div data-testid="hidden-content">Hidden</div>,
      hidden: false,
    },
  ],
  schema,
  uiSchema: {},
  idSchema: { $id: 'root' },
  formData: {},
  formContext: { formData: {} },
  registry,
  onAddClick: jest.fn(() => jest.fn()),
  required: false,
  disabled: false,
  readonly: false,
  ...overrides,
});

const getFieldLayout = (testId: string) => {
  const content = screen.getByTestId(testId);

  return {
    content,
    hiddenWrapper: content.closest('[data-hidden-field="true"]'),
    gridItem: content.closest('.MuiGrid-item'),
  };
};

describe('HiddenObjectFieldTemplate', () => {
  it('renders element.hidden properties with display:none instead of a Grid item', () => {
    render(
      <HiddenObjectFieldTemplate
        {...createProps({
          properties: [
            {
              name: 'visibleField',
              content: <div data-testid="visible-content">Visible</div>,
              hidden: false,
            },
            {
              name: 'hiddenField',
              content: <div data-testid="hidden-content">Hidden</div>,
              hidden: true,
            },
          ],
        })}
      />,
    );

    const hidden = getFieldLayout('hidden-content');
    expect(hidden.hiddenWrapper).toBeInTheDocument();
    expect(hidden.hiddenWrapper).toHaveStyle({ display: 'none' });
    expect(hidden.gridItem).toBeNull();

    const visible = getFieldLayout('visible-content');
    expect(visible.gridItem).toBeInTheDocument();
    expect(visible.gridItem).toHaveStyle({ marginBottom: '10px' });
  });

  it('renders ui:hidden:true properties with display:none instead of a Grid item', () => {
    const uiSchema: UiSchema<JsonObject, JSONSchema7> = {
      hiddenField: { 'ui:hidden': true },
    };

    render(<HiddenObjectFieldTemplate {...createProps({ uiSchema })} />);

    const hidden = getFieldLayout('hidden-content');
    expect(hidden.hiddenWrapper).toBeInTheDocument();
    expect(hidden.hiddenWrapper).toHaveStyle({ display: 'none' });
    expect(hidden.gridItem).toBeNull();

    const visible = getFieldLayout('visible-content');
    expect(visible.gridItem).toBeInTheDocument();
    expect(visible.gridItem).toHaveStyle({ marginBottom: '10px' });
  });

  it('renders conditionally hidden properties with display:none when the condition is true', () => {
    const uiSchema: UiSchema<JsonObject, JSONSchema7> = {
      hiddenField: { 'ui:hidden': { when: 'mode', is: 'hide' } },
    };

    render(
      <HiddenObjectFieldTemplate
        {...createProps({
          uiSchema,
          formData: { mode: 'hide' },
        })}
      />,
    );

    const hidden = getFieldLayout('hidden-content');
    expect(hidden.hiddenWrapper).toBeInTheDocument();
    expect(hidden.hiddenWrapper).toHaveStyle({ display: 'none' });
    expect(hidden.gridItem).toBeNull();

    const visible = getFieldLayout('visible-content');
    expect(visible.gridItem).toBeInTheDocument();
    expect(visible.gridItem).toHaveStyle({ marginBottom: '10px' });
  });

  it('renders conditionally hidden properties as Grid items when the condition is false', () => {
    const uiSchema: UiSchema<JsonObject, JSONSchema7> = {
      hiddenField: { 'ui:hidden': { when: 'mode', is: 'hide' } },
    };

    render(
      <HiddenObjectFieldTemplate
        {...createProps({
          uiSchema,
          formData: { mode: 'show' },
        })}
      />,
    );

    const hidden = getFieldLayout('hidden-content');
    expect(hidden.hiddenWrapper).toBeNull();
    expect(hidden.gridItem).toBeInTheDocument();
    expect(hidden.gridItem).toHaveStyle({ marginBottom: '10px' });

    const visible = getFieldLayout('visible-content');
    expect(visible.gridItem).toBeInTheDocument();
    expect(visible.gridItem).toHaveStyle({ marginBottom: '10px' });
  });
});
