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

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FormRequestCard } from './FormRequestCard';
import type { StreamFormDescriptor } from '@red-hat-developer-hub/backstage-plugin-augment-common';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('FormRequestCard', () => {
  it('renders form title and description', () => {
    const form: StreamFormDescriptor = {
      title: 'Deployment Config',
      description: 'Configure your deployment',
      fields: [],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByText('Deployment Config')).toBeInTheDocument();
    expect(screen.getByText('Configure your deployment')).toBeInTheDocument();
  });

  it('renders text field', () => {
    const form: StreamFormDescriptor = {
      fields: [{ name: 'username', type: 'text', label: 'Username' }],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders boolean field as switch', () => {
    const form: StreamFormDescriptor = {
      fields: [
        {
          name: 'enable_logs',
          type: 'boolean',
          label: 'Enable Logging',
          description: 'Turn on debug logging',
        },
      ],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByText('Enable Logging')).toBeInTheDocument();
    expect(screen.getByText('Turn on debug logging')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders select field with options', () => {
    const form: StreamFormDescriptor = {
      fields: [
        {
          name: 'env',
          type: 'select',
          label: 'Environment',
          options: [
            { value: 'dev', label: 'Development' },
            { value: 'prod', label: 'Production' },
          ],
        },
      ],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getAllByText('Environment').length).toBeGreaterThan(0);
    expect(screen.getByRole('combobox', { hidden: true })).toBeInTheDocument();
  });

  it('renders number field', () => {
    const form: StreamFormDescriptor = {
      fields: [{ name: 'replicas', type: 'number', label: 'Replicas' }],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByLabelText('Replicas')).toBeInTheDocument();
  });

  it('renders textarea field', () => {
    const form: StreamFormDescriptor = {
      fields: [{ name: 'notes', type: 'textarea', label: 'Notes' }],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('calls onSubmit with field values', () => {
    const onSubmit = jest.fn();
    const form: StreamFormDescriptor = {
      fields: [{ name: 'city', type: 'text', label: 'City' }],
    };
    renderWithTheme(<FormRequestCard form={form} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'Boston' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({ city: 'Boston' });
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = jest.fn();
    const form: StreamFormDescriptor = { fields: [] };
    renderWithTheme(<FormRequestCard form={form} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables submit when required field is empty', () => {
    const form: StreamFormDescriptor = {
      fields: [{ name: 'name', type: 'text', label: 'Name', required: true }],
    };
    renderWithTheme(<FormRequestCard form={form} onSubmit={jest.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when required field has a value', () => {
    const form: StreamFormDescriptor = {
      fields: [{ name: 'name', type: 'text', label: 'Name', required: true }],
    };
    renderWithTheme(<FormRequestCard form={form} onSubmit={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Alice' },
    });

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('populates default values', () => {
    const form: StreamFormDescriptor = {
      fields: [
        {
          name: 'region',
          type: 'text',
          label: 'Region',
          defaultValue: 'us-east-1',
        },
      ],
    };
    renderWithTheme(<FormRequestCard form={form} />);

    expect(screen.getByLabelText('Region')).toHaveValue('us-east-1');
  });
});
