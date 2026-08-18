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
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogItemWizardDialog } from './CatalogItemWizardDialog';
import { emptyCatalogItemForm } from '../catalogItemFormTypes';
import type { CatalogItemForm } from '../catalogItemFormTypes';

jest.mock('../../../hooks/useTranslation', () => {
  const mod = require('../../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

let uuidCounter = 0;

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => {
        uuidCounter += 1;
        return `test-uuid-${uuidCounter}`;
      },
    },
    writable: true,
    configurable: true,
  });

  // jsdom's File class does not inherit Blob#text; polyfill via FileReader.
  Object.defineProperty(File.prototype, 'text', {
    value: function text(): Promise<string> {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(reader.error ?? new Error('FileReader failed'));
        reader.readAsText(new Blob([this])); // NOSONAR -- jsdom Blob also lacks .text()
      });
    },
    writable: true,
    configurable: true,
  });
});

function Wrapper(
  props: Readonly<{
    isEditMode?: boolean;
  }>,
) {
  const [form, setForm] = useState<CatalogItemForm>(emptyCatalogItemForm());
  return (
    <CatalogItemWizardDialog
      open
      onClose={() => {}}
      title="Test"
      form={form}
      setForm={setForm}
      serviceTypes={[]}
      onSubmit={() => {}}
      submitLabel="Create"
      submitting={false}
      error={null}
      isEditMode={props.isEditMode ?? false}
    />
  );
}

/** New-shape YAML: spec.resources[] */
const VALID_CATALOG_JSON = JSON.stringify({
  display_name: 'My Item',
  api_version: 'v1alpha1',
  spec: {
    resources: [
      {
        name: 'app',
        service_type: 'vm',
        fields: [{ path: 'config.replicas' }],
      },
    ],
  },
});

/** Legacy shape: spec.service_type + spec.fields (no spec.resources). */
const LEGACY_CATALOG_JSON = JSON.stringify({
  display_name: 'Legacy Item',
  api_version: 'v1alpha1',
  spec: {
    service_type: 'container',
    fields: [{ path: 'config.replicas' }, { path: 'config.region' }],
  },
});

const SERVICE_TYPES = [
  { service_type: 'vm', uid: 'st-vm', api_version: 'v1', spec: {} },
  { service_type: 'postgres', uid: 'st-pg', api_version: 'v1', spec: {} },
];

function WrapperWithTypes(
  props: Readonly<{
    isEditMode?: boolean;
  }>,
) {
  const [form, setForm] = useState<CatalogItemForm>(emptyCatalogItemForm());
  return (
    <CatalogItemWizardDialog
      open
      onClose={() => {}}
      title="Test"
      form={form}
      setForm={setForm}
      serviceTypes={SERVICE_TYPES}
      onSubmit={() => {}}
      submitLabel="Create"
      submitting={false}
      error={null}
      isEditMode={props.isEditMode ?? false}
    />
  );
}

describe('CatalogItemWizardDialog – multi-resource wizard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('can navigate to the Resources tab and add a resource', async () => {
    render(<WrapperWithTypes />);

    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    await userEvent.click(resourcesTab);

    const addBtn = await screen.findByRole('button', { name: /add resource/i });
    await userEvent.click(addBtn);

    // After adding, the resource card header shows the unnamed-resource placeholder.
    // There will be at least one element (tab label + card heading), so use getAllByText.
    await waitFor(() =>
      expect(screen.getAllByText(/unnamed/i).length).toBeGreaterThan(0),
    );
  });

  it('shows duplicate name error when two resources share the same name after submit attempt', async () => {
    render(<WrapperWithTypes />);

    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    await userEvent.click(resourcesTab);

    const addBtn = await screen.findByRole('button', { name: /add resource/i });
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);

    // Wait for both resource cards to render; each card has a "Resource name" textbox.
    const nameInputs = await screen.findAllByRole('textbox');
    // The first two textboxes on the Resources tab are the resource-name fields.
    await userEvent.type(nameInputs[0], 'app');
    await userEvent.type(nameInputs[1], 'app');

    const nextBtn = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);

    const errors = await screen.findAllByText(/Resource name must be unique/i);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('CatalogItemWizardDialog – file import error handling', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an error alert when an invalid JSON file is imported', async () => {
    render(<Wrapper />);

    const file = new File(['not valid json'], 'bad.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(
      await screen.findByText(/Failed to import file/i),
    ).toBeInTheDocument();
  });

  it('does not show an error alert and creates a resource tab when a valid JSON file is imported', async () => {
    render(<Wrapper />);

    const file = new File([VALID_CATALOG_JSON], 'good.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    // No error alert.
    await waitFor(() =>
      expect(
        screen.queryByText(/Failed to import file/i),
      ).not.toBeInTheDocument(),
    );

    // A per-resource field tab labelled "app" must appear in the left nav,
    // proving spec.resources was not silently dropped.
    await screen.findByRole('tab', { name: 'app' });
  });

  it('wraps legacy shape (spec.service_type + spec.fields) into a "default" resource on import', async () => {
    render(<Wrapper />);

    const file = new File([LEGACY_CATALOG_JSON], 'legacy.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    // No error alert.
    await waitFor(() =>
      expect(
        screen.queryByText(/Failed to import file/i),
      ).not.toBeInTheDocument(),
    );

    // The legacy resource is wrapped as "default" and appears as a tab.
    await screen.findByRole('tab', { name: 'default' });
  });

  it('dismisses the error alert when the close button is clicked', async () => {
    render(<Wrapper />);

    const file = new File(['not valid json'], 'bad.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Failed to import file/i);

    const closeBtn = within(alert).getByRole('button');
    fireEvent.click(closeBtn);

    await waitFor(() =>
      expect(
        screen.queryByText(/Failed to import file/i),
      ).not.toBeInTheDocument(),
    );
  });
});
