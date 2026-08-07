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

  it('does not show an error alert when a valid JSON file is imported', async () => {
    render(<Wrapper />);

    const file = new File([VALID_CATALOG_JSON], 'good.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(
        screen.queryByText(/Failed to import file/i),
      ).not.toBeInTheDocument(),
    );
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
