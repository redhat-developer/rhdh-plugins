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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SchemaInvokeForm } from './SchemaInvokeForm';

const theme = createTheme();

function renderForm(
  props: Partial<React.ComponentProps<typeof SchemaInvokeForm>> = {},
) {
  const defaultProps: React.ComponentProps<typeof SchemaInvokeForm> = {
    schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        count: { type: 'integer', description: 'Number of results' },
        verbose: { type: 'boolean', description: 'Verbose output' },
      },
      required: ['city'],
    },
    onSubmit: jest.fn(),
    submitting: false,
    result: null,
    error: null,
    ...props,
  };
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <SchemaInvokeForm {...defaultProps} />
      </ThemeProvider>,
    ),
    props: defaultProps,
  };
}

describe('SchemaInvokeForm', () => {
  it('renders text fields for string properties', () => {
    renderForm();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  });

  it('renders number fields for integer properties', () => {
    renderForm();
    const countField = screen.getByLabelText(/count/i);
    expect(countField).toBeInTheDocument();
    expect(countField).toHaveAttribute('type', 'number');
  });

  it('renders switch for boolean properties', () => {
    renderForm();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('verbose')).toBeInTheDocument();
  });

  it('marks required fields', () => {
    renderForm();
    const cityField = screen.getByLabelText(/city/i);
    expect(cityField).toBeRequired();
  });

  it('does not mark optional fields as required', () => {
    renderForm();
    const countField = screen.getByLabelText(/count/i);
    expect(countField).not.toBeRequired();
  });

  it('renders select for enum properties', () => {
    const schema = {
      type: 'object',
      properties: {
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
    };
    renderForm({ schema });
    expect(screen.getByText('celsius')).toBeInTheDocument();
  });

  it('renders helper text as descriptions', () => {
    renderForm();
    expect(screen.getByText('City name')).toBeInTheDocument();
    expect(screen.getByText('Number of results')).toBeInTheDocument();
  });

  it('shows fallback JSON field for no-property schemas', () => {
    const schema = { type: 'object' };
    renderForm({ schema });
    expect(screen.getByLabelText(/arguments.*json/i)).toBeInTheDocument();
  });

  it('renders Invoke button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /invoke/i })).toBeInTheDocument();
  });

  it('disables Invoke button when submitting', () => {
    renderForm({ submitting: true });
    const buttons = screen.getAllByRole('button');
    const invokeBtn = buttons.find(
      b =>
        b.getAttribute('disabled') !== null && !b.textContent?.match(/cancel/i),
    );
    expect(invokeBtn).toBeTruthy();
    expect(invokeBtn).toBeDisabled();
  });

  it('renders result when provided', () => {
    renderForm({ result: '{"temp": 72}' });
    expect(screen.getByDisplayValue('{"temp": 72}')).toBeInTheDocument();
  });

  it('renders error alert when provided', () => {
    renderForm({ error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onSubmit with assembled values', async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/city/i), 'London');
    await user.click(screen.getByRole('button', { name: /invoke/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'London' }),
    );
  });

  it('provides a JSON toggle link', () => {
    renderForm();
    expect(screen.getByText(/switch to json/i)).toBeInTheDocument();
  });

  it('switches to JSON mode when toggle is clicked', async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByText(/switch to json/i));
    expect(screen.getByLabelText(/arguments.*json/i)).toBeInTheDocument();
    expect(screen.getByText(/switch to form/i)).toBeInTheDocument();
  });

  it('renders cancel button when onCancel is provided', () => {
    renderForm({ onCancel: jest.fn() });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render cancel button when onCancel is not provided', () => {
    renderForm();
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  it('renders array field with comma-separated hint', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: { type: 'array', description: 'Tag list' },
      },
    };
    renderForm({ schema });
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
  });

  it('renders JSON fallback for object/complex properties', () => {
    const schema = {
      type: 'object',
      properties: {
        config: { type: 'object', description: 'Config block' },
      },
    };
    renderForm({ schema });
    expect(screen.getByLabelText(/config.*json/i)).toBeInTheDocument();
  });
});
