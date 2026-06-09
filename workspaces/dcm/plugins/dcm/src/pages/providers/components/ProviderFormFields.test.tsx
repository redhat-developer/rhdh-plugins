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

import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProviderFormFields,
  ProviderFormFieldsProps,
} from './ProviderFormFields';
import { emptyProviderForm, ProviderForm } from '../providerFormTypes';

type TouchedMap = Partial<Record<keyof ProviderForm, boolean>>;

function Wrapper(
  props: Readonly<Pick<ProviderFormFieldsProps, 'serviceTypes' | 'isEditMode'>>,
) {
  const [form, setForm] = useState(emptyProviderForm());
  const [touched, setTouched] = useState<TouchedMap>({});
  return (
    <ProviderFormFields
      form={form}
      setForm={setForm}
      serviceTypes={props.serviceTypes ?? []}
      touched={touched}
      setTouched={setTouched}
      isEditMode={props.isEditMode ?? false}
    />
  );
}

// MUI v4 TextField does not associate label/input via for/id, so we use
// placeholder text and display values to target inputs directly.
const NAME_PLACEHOLDER = 'e.g. my-k8s-provider';
const ENDPOINT_PLACEHOLDER = 'https://api.example.com';
const SCHEMA_VERSION_DEFAULT = 'v1alpha1';

describe('ProviderFormFields – create mode', () => {
  it('renders all form fields', () => {
    render(<Wrapper serviceTypes={[]} />);

    expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(ENDPOINT_PLACEHOLDER),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(SCHEMA_VERSION_DEFAULT),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/service type \*/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^operations$/i).length).toBeGreaterThan(0);
  });

  it('Name field is enabled by default', () => {
    render(<Wrapper serviceTypes={[]} />);
    expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).not.toBeDisabled();
  });

  it('shows the slug hint helper text for the Name field', () => {
    render(<Wrapper serviceTypes={[]} />);
    expect(
      screen.getByText(
        /unique slug identifier — only lowercase letters, numbers, and hyphens/i,
      ),
    ).toBeInTheDocument();
  });

  it('updates the Name field value when the user types', async () => {
    render(<Wrapper serviceTypes={[]} />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'my-provider');
    expect(nameInput).toHaveValue('my-provider');
  });

  it('shows a validation error after blurring Name with an invalid value', async () => {
    render(<Wrapper serviceTypes={[]} />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'INVALID NAME');
    fireEvent.blur(nameInput);
    expect(
      screen.getByText(
        /only lowercase letters, numbers, and hyphens are allowed/i,
      ),
    ).toBeInTheDocument();
  });

  it('does not show a validation error for a valid Name value', async () => {
    render(<Wrapper serviceTypes={[]} />);
    const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER);
    await userEvent.type(nameInput, 'my-k8s-provider');
    fireEvent.blur(nameInput);
    expect(
      screen.queryByText(
        /only lowercase letters, numbers, and hyphens are allowed/i,
      ),
    ).not.toBeInTheDocument();
  });
});

describe('ProviderFormFields – edit mode', () => {
  it('Name field is disabled', () => {
    render(<Wrapper serviceTypes={[]} isEditMode />);
    expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toBeDisabled();
  });

  it('shows the immutability helper text for the Name field', () => {
    render(<Wrapper serviceTypes={[]} isEditMode />);
    expect(
      screen.getByText(/provider name cannot be changed after creation/i),
    ).toBeInTheDocument();
  });

  it('does not show the slug hint helper text for the Name field', () => {
    render(<Wrapper serviceTypes={[]} isEditMode />);
    expect(
      screen.queryByText(
        /unique slug identifier — only lowercase letters, numbers, and hyphens/i,
      ),
    ).not.toBeInTheDocument();
  });

  it('Endpoint field remains enabled', () => {
    render(<Wrapper serviceTypes={[]} isEditMode />);
    expect(
      screen.getByPlaceholderText(ENDPOINT_PLACEHOLDER),
    ).not.toBeDisabled();
  });

  it('Schema version field remains enabled', () => {
    render(<Wrapper serviceTypes={[]} isEditMode />);
    expect(screen.getByDisplayValue(SCHEMA_VERSION_DEFAULT)).not.toBeDisabled();
  });
});

describe('ProviderFormFields – service types dropdown', () => {
  it('shows "No service types available" placeholder when list is empty', () => {
    render(<Wrapper serviceTypes={[]} />);
    expect(screen.getByText(/no service types available/i)).toBeInTheDocument();
  });

  it('shows "Create a service type first" helper text when list is empty', () => {
    render(<Wrapper serviceTypes={[]} />);
    expect(
      screen.getByText(/create a service type first in the service types tab/i),
    ).toBeInTheDocument();
  });

  it('renders provided service type options', async () => {
    const serviceTypes = [
      { uid: '1', service_type: 'kubernetes' },
      { uid: '2', service_type: 'aws-ec2' },
    ];
    render(<Wrapper serviceTypes={serviceTypes} />);

    fireEvent.mouseDown(screen.getByRole('button', { name: /service type/i }));

    expect(await screen.findByText('kubernetes')).toBeInTheDocument();
    expect(await screen.findByText('aws-ec2')).toBeInTheDocument();
  });
});
